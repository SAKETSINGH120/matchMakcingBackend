const Feedback = require("./Feedback");

module.exports = {
  createTicket: async ({ userId, category, subject, message }) => {
    return Feedback.create({
      userId,
      type: "support_ticket",
      category,
      subject,
      message,
    });
  },

  getTickets: async ({ status, category, page = 1, limit = 10 }) => {
    const filter = { type: "support_ticket" };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [tickets, total] = await Promise.all([
      Feedback.find(filter)
        .populate("userId", "name number primaryImage")
        .populate("repliedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    return { tickets, total, page, limit };
  },

  getTicketById: async (ticketId) => {
    return Feedback.findById(ticketId)
      .populate("userId", "name number primaryImage")
      .populate("repliedBy", "name email")
      .lean();
  },

  replyToTicket: async (ticketId, { adminReply, repliedBy, status }) => {
    return Feedback.findByIdAndUpdate(
      ticketId,
      {
        adminReply,
        repliedBy,
        repliedAt: new Date(),
        status: status || "resolved",
      },
      { new: true },
    )
      .populate("userId", "name number")
      .populate("repliedBy", "name email")
      .lean();
  },

  updateTicketStatus: async (ticketId, status) => {
    return Feedback.findByIdAndUpdate(ticketId, { status }, { new: true })
      .populate("userId", "name number")
      .lean();
  },

  getTicketCounts: async () => {
    const counts = await Feedback.aggregate([
      { $match: { type: "support_ticket" } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return counts.reduce(
      (acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      },
      { open: 0, in_progress: 0, resolved: 0, closed: 0 },
    );
  },

  createRating: async ({
    userId,
    matchId,
    partnerRating,
    platformRating,
    comment,
  }) => {
    // Check if user already rated this match
    const existing = await Feedback.findOne({
      userId,
      matchId,
      type: "rating",
    });

    if (existing) {
      throw new Error("You have already submitted feedback for this match");
    }

    return Feedback.create({
      userId,
      type: "rating",
      matchId,
      partnerRating,
      platformRating,
      comment,
    });
  },

  // Get all ratings submitted by a user
  getMyRatings: async (userId, { page = 1, limit = 10 } = {}) => {
    const filter = { type: "rating", userId };

    const [ratings, total] = await Promise.all([
      Feedback.find(filter)
        .populate("partnerId", "name primaryImage")
        .select("partnerRating platformRating comment createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    return { ratings, total, page, limit };
  },

  // Get feedback received by a partner
  getPartnerFeedback: async (partnerId, { page = 1, limit = 10 } = {}) => {
    const filter = { type: "rating", partnerId };

    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter)
        .populate("userId", "name primaryImage")
        .select("partnerRating comment createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    return { feedbacks, total, page, limit };
  },

  // Get average partner rating
  getPartnerAvgRating: async (partnerId) => {
    const result = await Feedback.aggregate([
      { $match: { type: "rating", partnerId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$partnerRating" },
          total: { $sum: 1 },
        },
      },
    ]);

    if (!result.length) return { avgRating: 0, total: 0 };
    return {
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      total: result[0].total,
    };
  },

  // Get overall platform average rating
  getPlatformAvgRating: async () => {
    const result = await Feedback.aggregate([
      {
        $match: {
          type: "rating",
          platformRating: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$platformRating" },
          total: { $sum: 1 },
        },
      },
    ]);

    if (!result.length) return { avgRating: 0, total: 0 };
    return {
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      total: result[0].total,
    };
  },
};
