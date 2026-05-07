const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const adminSubscriptionService = require("../../services/adminSubscriptionService");
const AuditLogModel = require("../../models/auditLog/index");

const adminSubscriptionController = {
  getSubscriptions: async (req, res, next) => {
    try {
      const { status, plan, userId, search } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await adminSubscriptionService.getSubscriptions({
        status,
        plan,
        userId,
        search,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Subscriptions retrieved successfully",
        result.subscriptions,
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

  getPremiumUsers: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await adminSubscriptionService.getPremiumUsers({
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Premium users retrieved successfully",
        result.users,
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

  activateSubscription: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { plan, durationDays } = req.body;

      const subscription = await adminSubscriptionService.activateSubscription(
        userId,
        { plan, durationDays: parseInt(durationDays, 10) },
      );

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "activate_subscription",
        targetType: "subscription",
        targetId: subscription._id,
        details: { userId, plan, durationDays },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        201,
        "Subscription activated successfully",
        {
          id: subscription._id,
          userId: subscription.userId,
          plan: subscription.plan,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  deactivateSubscription: async (req, res, next) => {
    try {
      const subscription =
        await adminSubscriptionService.deactivateSubscription(
          req.params.userId,
        );

      if (!subscription) {
        throw APIError.notFound("No active subscription found for this user");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "deactivate_subscription",
        targetType: "subscription",
        targetId: subscription._id,
        details: { userId: req.params.userId },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Subscription deactivated successfully",
        {
          id: subscription._id,
          userId: subscription.userId,
          status: subscription.status,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  cancelSubscription: async (req, res, next) => {
    try {
      const subscription = await adminSubscriptionService.cancelSubscription(
        req.params.userId,
      );

      if (!subscription) {
        throw APIError.notFound("No active subscription found for this user");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "cancel_subscription",
        targetType: "subscription",
        targetId: subscription._id,
        details: { userId: req.params.userId },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Subscription cancelled successfully",
        {
          id: subscription._id,
          userId: subscription.userId,
          status: subscription.status,
          cancelledAt: subscription.cancelledAt,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  extendSubscription: async (req, res, next) => {
    try {
      const { extraDays } = req.body;

      const subscription = await adminSubscriptionService.extendSubscription(
        req.params.userId,
        parseInt(extraDays, 10),
      );

      if (!subscription) {
        throw APIError.notFound("No active subscription found for this user");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "extend_subscription",
        targetType: "subscription",
        targetId: subscription._id,
        details: { userId: req.params.userId, extraDays },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Subscription extended successfully",
        {
          id: subscription._id,
          userId: subscription.userId,
          plan: subscription.plan,
          endDate: subscription.endDate,
          status: subscription.status,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  getRevenueOverview: async (req, res, next) => {
    try {
      const overview = await adminSubscriptionService.getRevenueOverview();

      return APIResponse.send(
        res,
        true,
        200,
        "Revenue overview retrieved successfully",
        overview,
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminSubscriptionController;
