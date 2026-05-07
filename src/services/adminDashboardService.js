const User = require("../models/user/User");
const Match = require("../models/match/Match");
const Subscription = require("../models/subscription/Subscription");
const Swipe = require("../models/swipe/Swipe");
const ReportModel = require("../models/report/index");
const FeedbackModel = require("../models/feedback/index");

/**
 * Admin Dashboard Service
 * Aggregates high-level stats for the admin dashboard.
 */
const adminDashboardService = {
  /**
   * Get all key metrics in a single call.
   * Runs queries in parallel for performance.
   */
  getStats: async () => {
    const [
      totalUsers,
      totalFemale,
      totalMale,
      activeUsers,
      blockedUsers,
      deletedUsers,
      totalMatches,
      premiumUsers,
      totalSwipes,
      totalLikes,
      activeSubscriptions,
      reportCounts,
      ticketCounts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ geneder: "male" }),
      User.countDocuments({ geneder: "female" }),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "blocked" }),
      User.countDocuments({ status: "deleted" }),
      Match.countDocuments(),
      User.countDocuments({ isPremium: true }),
      Swipe.countDocuments(),
      Swipe.countDocuments({ action: "like" }),
      Subscription.countDocuments({ status: "active" }),
      ReportModel.getReportCounts(),
      FeedbackModel.getTicketCounts(),
    ]);

    return {
      users: {
        total: totalUsers,
        totalFemale: totalFemale,
        totalMale: totalMale,
        active: activeUsers,
        blocked: blockedUsers,
        // deleted: deletedUsers,
        premium: premiumUsers,
      },
      engagement: {
        totalSwipes,
        totalLikes,
        totalMatches,
        likeRate:
          totalSwipes > 0 ? Math.round((totalLikes / totalSwipes) * 100) : 0,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
      // reports: reportCounts,
      // feedback: ticketCounts,
    };
  },
};

module.exports = adminDashboardService;
