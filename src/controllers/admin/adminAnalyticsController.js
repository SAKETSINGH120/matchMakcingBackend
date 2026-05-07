const APIResponse = require("../../utils/APIResponse");
const adminAnalyticsService = require("../../services/adminAnalyticsService");

const adminAnalyticsController = {
  getUserGrowth: async (req, res, next) => {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const growth = await adminAnalyticsService.getUserGrowth(days);

      return APIResponse.send(
        res,
        true,
        200,
        "User growth data retrieved successfully",
        growth,
      );
    } catch (error) {
      next(error);
    }
  },

  getDemographics: async (req, res, next) => {
    try {
      const [genderDistribution, ageDistribution] = await Promise.all([
        adminAnalyticsService.getGenderDistribution(),
        adminAnalyticsService.getAgeDistribution(),
      ]);

      return APIResponse.send(
        res,
        true,
        200,
        "Demographics retrieved successfully",
        { gender: genderDistribution, age: ageDistribution },
      );
    } catch (error) {
      next(error);
    }
  },

  getEngagementTrends: async (req, res, next) => {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const trends = await adminAnalyticsService.getEngagementTrends(days);

      return APIResponse.send(
        res,
        true,
        200,
        "Engagement trends retrieved successfully",
        trends,
      );
    } catch (error) {
      next(error);
    }
  },

  getSubscriptionTrends: async (req, res, next) => {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const trends = await adminAnalyticsService.getSubscriptionTrends(days);

      return APIResponse.send(
        res,
        true,
        200,
        "Subscription trends retrieved successfully",
        trends,
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminAnalyticsController;
