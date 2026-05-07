const APIError = require("../utils/APIError");
const asyncHandler = require("../utils/asyncHandler");
const SubscriptionModel = require("../models/subscription/index");

/**
 * Middleware: requirePremium
 *
 * Attach this to any route that should only be accessible to
 * users with an active subscription. Must be placed AFTER
 * authenticateUser so that req.user is available.
 *
 * Flow:
 * 1. Quick check — if user.isPremium is false, reject immediately.
 * 2. Deep check — verify against the subscriptions collection
 *    (handles edge cases like expired subscriptions that haven't
 *     been cleaned up by the cron job yet).
 */
const requirePremium = asyncHandler(async (req, res, next) => {
  const user = req.user;

  // Quick-fail: the flag is already false
  if (!user.isPremium) {
    throw APIError.forbidden(
      "This feature requires a premium subscription. Please upgrade your plan.",
    );
  }

  // Deep verification against the subscription record
  const isActive = await SubscriptionModel.hasActiveSubscription(user._id);

  if (!isActive) {
    // The flag was stale — sync it back to false
    user.isPremium = false;
    await user.save();

    throw APIError.forbidden(
      "Your subscription has expired. Please renew to access premium features.",
    );
  }

  next();
});

module.exports = { requirePremium };
