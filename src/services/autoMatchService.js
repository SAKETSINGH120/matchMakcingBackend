const User = require("../models/user/User");
const Swipe = require("../models/swipe/Swipe");
const Match = require("../models/match/Match");
const mongoose = require("mongoose");
const compatibilityService = require("./compatibilityService");
const { AUTO_MATCH_THRESHOLD } = require("../constants");

/**
 * Auto-Match Service
 *
 * Finds highly compatible users and creates "system" matches automatically,
 * based on interests, preferences, location, lifestyle, and activity —
 * without requiring both users to swipe on each other first.
 *
 * Flow:
 *  1. Query candidates who satisfy the user's gender, age, and distance prefs
 *  2. Exclude users who have already been swiped on OR are already matched
 *  3. Score each candidate with the compatibility engine
 *  4. Create a system match for every candidate above the threshold
 */
const autoMatchService = {
  /**
   * Run auto-matching for a single user
   * @param {Object} currentUser – Mongoose user document
   * @param {Object} [options]
   * @param {Number} [options.threshold]      – min score to create match (default from constants)
   * @param {Number} [options.maxMatches]      – cap how many system matches to create per run
   * @returns {Object} { newMatches, totalCandidates }
   */
  generateMatches: async (
    currentUser,
    { threshold = AUTO_MATCH_THRESHOLD, maxMatches = 5 } = {},
  ) => {
    const userId = currentUser._id;
    console.log("🚀 ~ userId:", userId);

    // ── 1. IDs to exclude (already swiped + already matched) ─────────
    const [swipedUserIds, existingMatchDocs] = await Promise.all([
      Swipe.distinct("toUser", { fromUser: userId }),
      Match.find({ users: userId, status: "active" }).select("users").lean(),
    ]);

    // Flatten matched user IDs
    const matchedUserIds = existingMatchDocs.flatMap((m) =>
      m.users.map((u) => u.toString()),
    );

    const excludeIds = [
      ...new Set([
        userId.toString(),
        ...swipedUserIds.map((id) => id.toString()),
        ...matchedUserIds,
      ]),
    ].map((id) => new mongoose.Types.ObjectId(id));

    // ── 2. Build preference-based filters ──────────────────────────
    const matchFilters = {
      _id: { $nin: excludeIds },
      status: "active",
    };

    // Gender preference
    const interestedIn = currentUser.preferences?.interestedIn;
    if (interestedIn && interestedIn !== "everyone") {
      matchFilters.gender = interestedIn;
    }

    // Age preference
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

    // ── 3. Aggregation pipeline ─────────────────────────────────────
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

    // Only fetch recently active users to keep quality high
    pipeline.push({ $sort: { lastActiveAt: -1, createdAt: -1 } });

    // Limit the candidate pool for performance
    pipeline.push({ $limit: 100 });

    // Project fields needed by the compatibility scorer
    pipeline.push({
      $project: {
        name: 1,
        gender: 1,
        dob: 1,
        bio: 1,
        primaryImage: 1,
        interests: 1,
        lifestyle: 1,
        relationshipGoal: 1,
        preferences: 1,
        "location.city": 1,
        "location.country": 1,
        "location.coordinates": 1,
        lastActiveAt: 1,
        activityScore: 1,
        distanceMeters: 1,
      },
    });

    const candidates = await User.aggregate(pipeline);

    // ── 4. Score & filter ────────────────────────────────────────────
    const currentUserObj = currentUser.toObject
      ? currentUser.toObject()
      : currentUser;

    const scored = candidates
      .map((candidate) => {
        const distanceKm =
          candidate.distanceMeters !== undefined
            ? candidate.distanceMeters / 1000
            : null;

        const score = compatibilityService.calculateScore(
          currentUserObj,
          candidate,
          distanceKm,
        );

        return { candidate, score, distanceKm };
      })
      .filter((item) => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxMatches);

    // ── 5. Create system matches ─────────────────────────────────────
    const newMatches = [];

    for (const { candidate, score, distanceKm } of scored) {
      // Double-check that the other user's preferences also accept us
      if (!autoMatchService._mutualPreferenceCheck(currentUserObj, candidate)) {
        continue;
      }

      const sortedUsers = [userId, candidate._id].sort();

      // Atomic upsert to prevent duplicate matches
      const match = await Match.findOneAndUpdate(
        { users: sortedUsers, status: { $ne: "active" } },
        {
          $setOnInsert: {
            users: sortedUsers,
            matchedAt: new Date(),
            compatibilityScore: score,
            matchType: "system",
            status: "active",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).catch((err) => {
        // Duplicate key = match already exists → skip silently
        if (err.code === 11000) return null;
        throw err;
      });

      if (match && match.matchType === "system") {
        newMatches.push({
          matchId: match._id,
          userId: candidate._id,
          name: candidate.name,
          primaryImage: candidate.primaryImage,
          compatibilityScore: score,
          distanceKm: distanceKm !== null ? Math.round(distanceKm) : null,
          city: candidate.location?.city,
        });
      }
    }

    console.log("newMatches", newMatches);

    return {
      newMatches,
      totalCandidates: candidates.length,
    };
  },

  /**
   * Check whether the OTHER user's preferences also accept the current user.
   * (Gender match + age range)
   */
  _mutualPreferenceCheck(currentUser, candidate) {
    // Does the candidate's interestedIn match our gender?
    const candidateInterest = candidate.preferences?.interestedIn;
    if (
      candidateInterest &&
      candidateInterest !== "everyone" &&
      candidateInterest !== currentUser.gender
    ) {
      return false;
    }

    // Does our age fall within the candidate's preferred range?
    if (currentUser.dob) {
      const age = autoMatchService._ageFromDob(currentUser.dob);
      const cMinAge = candidate.preferences?.minAge;
      const cMaxAge = candidate.preferences?.maxAge;
      if (cMinAge && age < cMinAge) return false;
      if (cMaxAge && age > cMaxAge) return false;
    }

    return true;
  },

  /**
   * Simple age calculator from DOB
   */
  _ageFromDob(dob) {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  },
};

module.exports = autoMatchService;
