const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const FeedbackModel = require("../../models/feedback/index");
const AuditLogModel = require("../../models/auditLog/index");
const Feedback = require("../../models/feedback/Feedback");

const adminFeedbackController = {
  getTickets: async (req, res, next) => {
    try {
      const { status, category } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await FeedbackModel.getTickets({
        status,
        category,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Tickets fetched",
        result.tickets,
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

  getTicketById: async (req, res, next) => {
    try {
      const ticket = await FeedbackModel.getTicketById(req.params.id);
      if (!ticket) throw APIError.notFound("Ticket not found");
      return APIResponse.send(res, true, 200, "Ticket fetched", ticket);
    } catch (error) {
      next(error);
    }
  },

  replyToTicket: async (req, res, next) => {
    try {
      const { adminReply, status } = req.body;

      const ticket = await FeedbackModel.replyToTicket(req.params.id, {
        adminReply,
        repliedBy: req.admin._id,
        status,
      });

      if (!ticket) throw APIError.notFound("Ticket not found");

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "reply_ticket",
        targetType: "feedback",
        targetId: req.params.id,
        details: { status: ticket.status },
        ipAddress: req.ip,
      });

      return APIResponse.send(res, true, 200, "Ticket replied", ticket);
    } catch (error) {
      next(error);
    }
  },

  updateTicketStatus: async (req, res, next) => {
    try {
      const ticket = await FeedbackModel.updateTicketStatus(
        req.params.id,
        req.body.status,
      );
      if (!ticket) throw APIError.notFound("Ticket not found");
      return APIResponse.send(res, true, 200, "Status updated", ticket);
    } catch (error) {
      next(error);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const [ticketCounts, platformStats] = await Promise.all([
        FeedbackModel.getTicketCounts(),
        FeedbackModel.getPlatformAvgRating(),
      ]);

      return APIResponse.send(res, true, 200, "Feedback stats fetched", {
        tickets: ticketCounts,
        platform: platformStats,
      });
    } catch (error) {
      next(error);
    }
  },

  getRatings: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const filter = { type: "rating" };

      const [ratings, total] = await Promise.all([
        Feedback.find(filter)
          .populate("userId", "name number primaryImage")
          .populate({
            path: "matchId",
            select: "users",
            populate: {
              path: "users",
              select: "name number ",
            },
          })
          .select(
            "userId matchId partnerRating platformRating comment createdAt",
          )
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Feedback.countDocuments(filter),
      ]);

      return APIResponse.send(res, true, 200, "Ratings fetched", ratings, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminFeedbackController;
