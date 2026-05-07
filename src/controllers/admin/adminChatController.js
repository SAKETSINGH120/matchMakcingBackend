const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const MatchModel = require("../../models/match/index");
const MessageModel = require("../../models/message/index");

const adminChatController = {
  /**
   * GET /api/v1/admin/chat/:matchId
   * Get chat history for any match — no participant check needed for admin.
   */
  getChatHistory: async (req, res, next) => {
    try {
      const { matchId } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;

      const match = await MatchModel.getMatchById(matchId);
      if (!match) {
        throw APIError.notFound("Match not found");
      }

      const result = await MessageModel.getMessages(matchId, { page, limit });

      const participants = match.users.map((u) => ({
        _id: u._id,
        name: u.name,
        primaryImage: u.primaryImage,
      }));

      const messages = result.messages.map((msg) => ({
        _id: msg._id,
        sender: msg.sender,
        text: msg.text,
        messageType: msg.messageType,
        seen: msg.seen,
        seenAt: msg.seenAt || null,
        createdAt: msg.createdAt,
      }));

      return APIResponse.send(
        res,
        true,
        200,
        "Chat history retrieved successfully",
        {
          matchId: match._id,
          status: match.status,
          chatEnabled: match.chatEnabled,
          matchType: match.matchType,
          compatibilityScore: match.compatibilityScore,
          matchedAt: match.matchedAt,
          participants,
          messages,
        },
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
};

module.exports = adminChatController;
