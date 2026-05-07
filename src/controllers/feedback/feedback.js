const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const FeedbackModel = require("../../models/feedback/index");

const feedbackController = {
  createTicket: async (req, res, next) => {
    try {
      const { category, subject, message } = req.body;
      const ticket = await FeedbackModel.createTicket({
        userId: req.user._id,
        category,
        subject,
        message,
      });
      return APIResponse.send(
        res,
        true,
        201,
        "Support ticket submitted",
        ticket,
      );
    } catch (error) {
      next(error);
    }
  },

  getMyTickets: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const Feedback = require("../../models/feedback/Feedback");
      const filter = { userId: req.user._id, type: "support_ticket" };

      const [tickets, total] = await Promise.all([
        Feedback.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Feedback.countDocuments(filter),
      ]);

      return APIResponse.send(res, true, 200, "Tickets fetched", tickets, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  },

  createRating: async (req, res, next) => {
    try {
      const { matchId, partnerRating, platformRating, comment } = req.body;

      const rating = await FeedbackModel.createRating({
        userId: req.user._id,
        matchId,
        partnerRating,
        platformRating,
        comment,
      });

      return APIResponse.send(res, true, 201, "Feedback submitted", rating);
    } catch (error) {
      next(error);
    }
  },

  getMyRatings: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const result = await FeedbackModel.getMyRatings(req.user._id, {
        page,
        limit,
      });
      return APIResponse.send(res, true, 200, "Ratings fetched", result);
    } catch (error) {
      next(error);
    }
  },

  getPartnerFeedback: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const mongoose = require("mongoose");

      const partnerId = new mongoose.Types.ObjectId(req.params.partnerId);
      const result = await FeedbackModel.getPartnerFeedback(partnerId, {
        page,
        limit,
      });

      const stats = await FeedbackModel.getPartnerAvgRating(partnerId);
      return APIResponse.send(res, true, 200, "Partner feedback fetched", {
        ...result,
        stats,
      });
    } catch (error) {
      next(error);
    }
  },

  getPlatformStats: async (req, res, next) => {
    try {
      const stats = await FeedbackModel.getPlatformAvgRating();
      return APIResponse.send(res, true, 200, "Platform stats fetched", stats);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = feedbackController;
