const User = require("../models/user/User");
const Swipe = require("../models/swipe/Swipe");
const mongoose = require("mongoose");
const compatibilityService = require("./compatibilityService");
const AdminSuggestedProfiles = require("../models/suggestedProfile/index");
const AdminSuggestedProfilesModel = require("../models/suggestedProfile/adminSuggestedProfiles");
const APIError = require("../utils/APIError");

const getAgeFromDob = (dob, today = new Date()) => {
  if (!dob) return null;

  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const feedService = {
  getSuggestedUsers: async (currentUser, { page = 1, limit = 10 }) => {
    const userId = currentUser._id;

    // for now we remove to dont hide the users that the current user has swiped on, but we can add this in the future if we want to hide them
    const swipedUserIds = await Swipe.distinct("toUser", { fromUser: userId });

    // const excludeIds = [userId, ...swipedUserIds].map(
    //   (id) => new mongoose.Types.ObjectId(id),
    // );

    const excludeIds = [userId];

    const matchFilters = {
      _id: { $nin: excludeIds },
      status: "active",
    };

    const currentUserGender = currentUser.gender?.toLowerCase();
    const oppositeGenderMap = {
      male: "female",
      female: "male",
    };

    // For now, enforce opposite-gender feed when current user gender is male/female.
    if (oppositeGenderMap[currentUserGender]) {
      matchFilters.gender = oppositeGenderMap[currentUserGender];
    } else {
      const interestedIn = currentUser.preferences?.interestedIn;
      if (interestedIn && interestedIn !== "everyone") {
        matchFilters.gender = interestedIn;
      }
    }

    const minAge = currentUser.preferences?.minAge;
    const maxAge = currentUser.preferences?.maxAge;

    if (minAge || maxAge) {
      matchFilters.dob = {};
      const now = new Date();

      if (maxAge) {
        const oldestDob = new Date(now);
        oldestDob.setFullYear(oldestDob.getFullYear() - maxAge - 1);
        matchFilters.dob.$gte = oldestDob;
      }

      if (minAge) {
        const youngestDob = new Date(now);
        youngestDob.setFullYear(youngestDob.getFullYear() - minAge);
        matchFilters.dob.$lte = youngestDob;
      }
    }

    const pipeline = [];

    const hasLocation =
      currentUser.location?.coordinates?.length === 2 &&
      currentUser.location.coordinates[0] !== 0;

    const maxDistanceKm = currentUser.preferences?.maxDistanceKm || 50;

    if (hasLocation) {
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: currentUser.location.coordinates,
          },
          distanceField: "distanceMeters",
          maxDistance: maxDistanceKm * 1000,
          spherical: true,
          query: matchFilters,
        },
      });
    } else {
      pipeline.push({ $match: matchFilters });
    }

    pipeline.push({
      $sort: { lastActiveAt: -1, createdAt: -1 },
    });

    const candidateLimit = Math.min(limit * 5, 200);

    pipeline.push({
      $limit: candidateLimit,
    });

    pipeline.push({
      $project: {
        name: 1,
        gender: 1,
        dob: 1,
        bio: 1,
        primaryImage: 1,
        education: 1,
        profession: 1,
        company: 1,
        heightCm: 1,
        languages: 1,
        interests: 1,
        isVerified: 1,
        "location.city": 1,
        "location.country": 1,
        "location.coordinates": 1,
        lifestyle: 1,
        relationshipGoal: 1,
        lastActiveAt: 1,
        activityScore: 1,
        distanceMeters: 1,
      },
    });

    const candidates = await User.aggregate(pipeline);
    const today = new Date();

    // ---- 4. Score each candidate using the compatibility service ----
    const scored = candidates.map((candidate) => {
      const distanceKm =
        candidate.distanceMeters !== undefined
          ? candidate.distanceMeters / 1000
          : null;

      const compatibilityScore = compatibilityService.calculateScore(
        currentUser,
        candidate,
        distanceKm,
      );

      // Convert distance for response
      if (candidate.distanceMeters !== undefined) {
        candidate.distanceKm = Math.round(candidate.distanceMeters / 1000);
        delete candidate.distanceMeters;
      }

      // Remove raw fields not needed in response
      delete candidate.location?.coordinates;
      delete candidate.lifestyle;
      delete candidate.activityScore;

      candidate.age = getAgeFromDob(candidate.dob, today);

      return { ...candidate, compatibilityScore };
    });

    // ---- 5. Sort by compatibility score (descending) ----
    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // ---- 6. Paginate the scored results ----
    const total = scored.length;
    const skip = (page - 1) * limit;
    const users = scored.slice(skip, skip + limit);

    return { users, total, page, limit };
  },
  getFeedDetails: async (feedId) => {
    const result = await User.findById(feedId).lean();
    if (!result) return result;

    result.age = getAgeFromDob(result.dob);
    return result;
  },

  getSuggestedUsersFromAdmin: async (userId, { page = 1, limit = 10 }) => {
    const suggestedProfileIds = await AdminSuggestedProfilesModel.find({
      userId,
      status: "active",
    })
      .select("profileId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const profileIds = suggestedProfileIds.map((sp) => sp.profileId);

    if (profileIds.length === 0) {
      return { users: [], total: 0, page, limit };
    }

    const [profiles, total] = await Promise.all([
      User.find({ _id: { $in: profileIds }, status: "active" })
        .select(
          "name gender dob bio primaryImage education profession company heightCm languages interests isVerified location relationshipGoal",
        )
        .lean(),
      AdminSuggestedProfilesModel.countDocuments({
        userId,
        status: "active",
      }),
    ]);

    const today = new Date();
    const profilesWithAge = profiles.map((profile) => ({
      ...profile,
      age: getAgeFromDob(profile.dob, today),
    }));

    return { users: profilesWithAge, total, page, limit };
  },

  assignProfileToUserInSingleAndBulk: async (userId, profileIds, addedBy) => {
    try {
      const result = await AdminSuggestedProfiles.addProfileToUserFeed({
        userId,
        profileIds: Array.isArray(profileIds) ? profileIds : [profileIds],
        addedBy,
      });

      return {
        success: true,
        message: "Profiles assigned to user feed successfully",
        result,
      };
    } catch (error) {
      throw APIError.internal(`Failed to assign profiles: ${error.message}`);
    }
  },

  getAvailableProfilesForAssignment: async (
    userId,
    { page = 1, limit = 20 },
  ) => {
    const user = await User.findById(userId).select("gender").lean();
    if (!user) {
      throw new APIError("User not found", 400);
    }

    const userGender = user.gender?.toLowerCase();
    const oppositeGenderMap = {
      male: "female",
      female: "male",
    };

    const targetGender = oppositeGenderMap[userGender];
    if (!targetGender) {
      return { profiles: [], total: 0, page, limit };
    }

    const assignedProfileIds = await AdminSuggestedProfilesModel.distinct(
      "profileId",
      {
        userId,
        status: "active",
      },
    );

    const filterQuery = {
      // _id: { $nin: assignedProfileIds },
      gender: targetGender,
      status: "active",
    };

    const [profiles, total] = await Promise.all([
      User.find(filterQuery)
        .select(
          "name gender dob bio primaryImage education profession isVerified",
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filterQuery),
    ]);

    const today = new Date();
    const assignedProfileIdsSet = new Set(
      assignedProfileIds.map((id) => id.toString()),
    );

    const profilesWithAge = profiles.map((profile) => ({
      ...profile,
      age: getAgeFromDob(profile.dob, today),
      isAssigned: assignedProfileIdsSet.has(profile._id.toString()),
    }));

    return { profiles: profilesWithAge, total, page, limit };
  },

  clearUserFeed: async (userId) => {
    if (!userId) {
      throw new APIError("userId is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new APIError("Invalid user ID", 400);
    }

    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw new APIError("User not found", 404);
    }

    const result = await AdminSuggestedProfilesModel.updateMany(
      { userId, status: "active" },
      { $set: { status: "inactive" } },
    );

    return {
      success: true,
      message: "Feed cleared successfully",
      modifiedCount: result.modifiedCount,
    };
  },

  removeProfileFromUserFeed: async (userId, targetProfileId) => {
    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw new APIError("User not found", 404);
    }

    const result = await AdminSuggestedProfilesModel.updateMany(
      { userId, status: "active", profileId: targetProfileId },
      { $set: { status: "inactive" } },
    );

    return {
      success: true,
      message: "Profile removed from the user's feed successfully",
    };
  },
};

module.exports = feedService;
