const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const SubscriptionModel = require("../../models/subscription/index");

const PLAN_CONFIG = {
  basic: { price: 9.99, durationDays: 30 },
  gold: { price: 19.99, durationDays: 30 },
  platinum: { price: 49.99, durationDays: 90 },
};

const subscriptionController = {
  createSubscription: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { plan, paymentId } = req.body;

      const planDetails = PLAN_CONFIG[plan];
      if (!planDetails) {
        throw APIError.badRequest(`Invalid plan: ${plan}`);
      }

      const existing = await SubscriptionModel.getActiveSubscription(userId);
      if (existing) {
        throw APIError.conflict(
          "You already have an active subscription. Cancel it first to switch plans.",
        );
      }

      const subscription = await SubscriptionModel.createSubscription({
        userId,
        plan,
        price: planDetails.price,
        paymentId,
        durationDays: planDetails.durationDays,
      });

      return APIResponse.send(
        res,
        true,
        201,
        "Subscription activated successfully",
        {
          id: subscription._id,
          plan: subscription.plan,
          price: subscription.price,
          currency: subscription.currency,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  getMySubscription: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const subscription =
        await SubscriptionModel.getActiveSubscription(userId);

      if (!subscription) {
        return APIResponse.send(
          res,
          true,
          200,
          "No active subscription found",
          { subscription: null },
        );
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Subscription retrieved successfully",
        {
          id: subscription._id,
          plan: subscription.plan,
          price: subscription.price,
          currency: subscription.currency,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  cancelSubscription: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const subscription = await SubscriptionModel.cancelSubscription(userId);

      if (!subscription) {
        throw APIError.notFound("No active subscription to cancel");
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Subscription cancelled successfully",
        {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          cancelledAt: subscription.cancelledAt,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  getPlans: async (req, res, next) => {
    try {
      const plans = Object.entries(PLAN_CONFIG).map(([name, details]) => ({
        name,
        price: details.price,
        currency: "USD",
        durationDays: details.durationDays,
      }));

      return APIResponse.send(res, true, 200, "Plans retrieved successfully", {
        plans,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = subscriptionController;
