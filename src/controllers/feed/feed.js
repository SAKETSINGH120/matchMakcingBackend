const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const feedService = require("../../services/feedService");
const autoMatchService = require("../../services/autoMatchService");

const feedController = {
  getFeed: async (req, res, next) => {
    try {
      const currentUser = req.user;

      // if (!currentUser.gender || !currentUser.dob) {
      //   throw APIError.badRequest(
      //     "Please complete your profile (gender and date of birth) before browsing",
      //   );
      // }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      // const result = await feedService.getSuggestedUsers(currentUser, {
      //   page,
      //   limit,
      // });

      const result = await feedService.getSuggestedUsersFromAdmin(
        currentUser._id,
        {
          page,
          limit,
        },
      );
      console.log("🚀 ~ result:", result);

      if (page === 1) {
        autoMatchService.generateMatches(currentUser).catch(() => {});
      }

        console.log("🚀 ~ result.users,:", result.users,)
      return APIResponse.send(
        res,
        true,
        200,
        "Feed retrieved successfully",
        result.users,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      );
    } catch (error) {
      next(error);
    }
  },
  getFeedDetails: async (req, res, next) => {
    const feedId = req.params.feedId;
    try {
      const result = await feedService.getFeedDetails(feedId);

      if (!result) {
        throw new APIError("feed details not found", 400);
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Feed Details retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  },
  getAdminSuggestedFeed: async (req, res, next) => {
    try {
      const currentUser = req.user;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await feedService.getSuggestedUsersFromAdmin(
        currentUser._id,
        { page, limit },
      );

      return APIResponse.send(
        res,
        true,
        200,
        "Admin suggested feed retrieved successfully",
        result.users,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      );
    } catch (error) {
      next(error);
    }
  },
  clearFeed: async (req, res, next) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        throw new APIError("userId is required", 400);
      }

      const result = await feedService.clearUserFeed(userId);

      return APIResponse.send(res, true, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  },
  removeProfileFromUserFeed: async (req, res, next) => {
    const { userId, targetProfileId } = req.body;

    if (!userId || !targetProfileId) {
      throw new APIError("userId , profileId is required", 400);
    }

    const result = await feedService.removeProfileFromUserFeed(
      userId,
      targetProfileId,
    );

    return APIResponse.send(res, true, 200, result.message, {});
  },
};

module.exports = feedController;
