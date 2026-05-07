const Message = require("./message");

module.exports = {
  /**
   * Save a new message to the database.
   */
  createMessage: async ({ matchId, sender, text, messageType = "text" }) => {
    const message = await Message.create({
      matchId,
      sender,
      text,
      messageType,
    });
    return message.toObject();
  },

  /**
   * Get paginated chat history for a match (newest first).
   */
  getMessages: async (matchId, { page = 1, limit = 50 } = {}) => {
    const [messages, total] = await Promise.all([
      Message.find({ matchId })
        .populate("sender", "name primaryImage")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Message.countDocuments({ matchId }),
    ]);

    return { messages: messages.reverse(), total, page, limit };
  },

  /**
   * Mark all unseen messages in a match as seen (for a specific receiver).
   * Only marks messages NOT sent by the current user.
   */
  markAsSeen: async (matchId, userId) => {
    const result = await Message.updateMany(
      { matchId, sender: { $ne: userId }, seen: false },
      { seen: true, seenAt: new Date() },
    );
    return result.modifiedCount;
  },

  /**
   * Get count of unseen messages for a user in a match.
   */
  getUnseenCount: async (matchId, userId) => {
    return Message.countDocuments({
      matchId,
      sender: { $ne: userId },
      seen: false,
    });
  },
};
