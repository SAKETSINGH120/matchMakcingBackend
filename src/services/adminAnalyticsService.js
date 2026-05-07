const User = require("../models/user/User");
const Swipe = require("../models/swipe/Swipe");
const Match = require("../models/match/Match");
const Subscription = require("../models/subscription/Subscription");

const adminAnalyticsService = {
  getUserGrowth: async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]);

    return growth;
  },

  getGenderDistribution: async () => {
    const distribution = await User.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
      { $project: { _id: 0, gender: "$_id", count: 1 } },
    ]);

    return distribution;
  },

  getAgeDistribution: async () => {
    const now = new Date();

    const distribution = await User.aggregate([
      { $match: { status: "active", dob: { $exists: true, $ne: null } } },
      {
        $addFields: {
          age: {
            $dateDiff: { startDate: "$dob", endDate: now, unit: "year" },
          },
        },
      },
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [18, 25, 30, 35, 40, 50, 60, 100],
          default: "60+",
          output: { count: { $sum: 1 } },
        },
      },
      {
        $project: {
          _id: 0,
          ageRange: {
            $cond: {
              if: { $eq: ["$_id", "60+"] },
              then: "60+",
              else: {
                $concat: [
                  { $toString: "$_id" },
                  "-",
                  {
                    $toString: {
                      $subtract: [
                        {
                          $arrayElemAt: [
                            [18, 25, 30, 35, 40, 50, 60, 100],
                            {
                              $add: [
                                {
                                  $indexOfArray: [
                                    [18, 25, 30, 35, 40, 50, 60, 100],
                                    "$_id",
                                  ],
                                },
                                1,
                              ],
                            },
                          ],
                        },
                        1,
                      ],
                    },
                  },
                ],
              },
            },
          },
          count: 1,
        },
      },
    ]);

    return distribution;
  },

  getEngagementTrends: async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [swipeTrends, matchTrends] = await Promise.all([
      Swipe.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            totalSwipes: { $sum: 1 },
            likes: {
              $sum: { $cond: [{ $eq: ["$action", "like"] }, 1, 0] },
            },
            dislikes: {
              $sum: { $cond: [{ $eq: ["$action", "dislike"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            totalSwipes: 1,
            likes: 1,
            dislikes: 1,
          },
        },
      ]),

      Match.aggregate([
        { $match: { matchedAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$matchedAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),
    ]);

    return { swipes: swipeTrends, matches: matchTrends };
  },

  getSubscriptionTrends: async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const trends = await Subscription.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            plan: "$plan",
          },
          count: { $sum: 1 },
          revenue: { $sum: "$price" },
        },
      },
      { $sort: { "_id.date": 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          plan: "$_id.plan",
          count: 1,
          revenue: 1,
        },
      },
    ]);

    return trends;
  },
};

module.exports = adminAnalyticsService;
