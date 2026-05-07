const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const MatchModel = require("../../models/match/index");
const MessageModel = require("../../models/message/index");

const chatController = {
  /**
   * GET /api/chat/:matchId
   * Get paginated chat history for an approved match.
   * Query params: page, limit
   */
  getChatHistory: async (req, res, next) => {
    const userId = req.user._id;
    const { matchId } = req.params;

    try {
      // Verify match exists, is approved, and user is part of it
      const match = await MatchModel.getMatchById(matchId);

      if (!match) {
        throw APIError.notFound("Match not found");
      }

      const isParticipant = match.users.some(
        (u) => u._id.toString() === userId.toString(),
      );
      if (!isParticipant) {
        throw APIError.forbidden("You are not part of this match");
      }

      if (!match.chatEnabled) {
        throw APIError.forbidden("Chat is not enabled for this match yet");
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;

      const result = await MessageModel.getMessages(matchId, { page, limit });

      return APIResponse.send(
        res,
        true,
        200,
        "Chat history retrieved successfully",
        result.messages,
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

  /**
   * PATCH /api/chat/:matchId/seen
   * Mark all messages in this match as seen by the current user.
   */
  markAsSeen: async (req, res, next) => {
    const userId = req.user._id;
    const { matchId } = req.params;

    try {
      const match = await MatchModel.getMatchById(matchId);

      if (!match) {
        throw APIError.notFound("Match not found");
      }

      const isParticipant = match.users.some(
        (u) => u._id.toString() === userId.toString(),
      );
      if (!isParticipant) {
        throw APIError.forbidden("You are not part of this match");
      }

      const markedCount = await MessageModel.markAsSeen(matchId, userId);

      // Notify the other user via socket that messages were seen
      const io = req.app.get("io");
      if (io) {
        io.to(matchId.toString()).emit("messages_seen", {
          matchId,
          seenBy: userId,
          count: markedCount,
        });
      }

      return APIResponse.send(res, true, 200, "Messages marked as seen", {
        markedCount,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = chatController;
