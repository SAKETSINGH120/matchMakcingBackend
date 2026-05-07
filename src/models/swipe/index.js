const Swipe = require("./Swipe");

module.exports = {
  // Record a swipe from one user to another (like, dislike, or superlike)
  createSwipe: async (fromUser, toUser, action) => {
    const swipe = await Swipe.findOneAndUpdate(
      { fromUser, toUser },
      { action },
      { upsert: true, new: true },
    );
    return swipe;
  },

  // Check if a specific user has already liked (or superliked) the current user
  hasLiked: async (fromUser, toUser) => {
    const swipe = await Swipe.findOne({
      fromUser,
      toUser,
      action: { $in: ["like", "superlike"] },
    }).lean();
    return !!swipe;
  },

  // Get all swipes made by a user
  getSwipesByUser: async (userId) => {
    return Swipe.find({ fromUser: userId })
      .populate("toUser", "name primaryImage")
      .sort({ createdAt: -1 })
      .lean();
  },

  // Get users who liked the current user (for premium feature)
  getLikesReceived: async (userId) => {
    return Swipe.find({
      toUser: userId,
      action: { $in: ["like", "superlike"] },
    })
      .populate("fromUser", "name primaryImage bio interests location.city")
      .sort({ createdAt: -1 })
      .lean();
  },

  // Get swiped user IDs for feed exclusion
  getSwipedUserIds: async (userId) => {
    return Swipe.distinct("toUser", { fromUser: userId });
  },
};
