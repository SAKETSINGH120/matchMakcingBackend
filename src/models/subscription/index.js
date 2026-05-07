const Subscription = require("./Subscription");
const User = require("../user/User");

module.exports = {
  /**
   * Create a new subscription after a successful payment.
   * - Marks any existing active subscription as expired first.
   * - Sets the user's isPremium flag to true.
   */
  createSubscription: async ({
    userId,
    plan,
    price,
    paymentId,
    durationDays,
  }) => {
    // Expire any currently active subscription for this user
    await Subscription.updateMany(
      { userId, status: "active" },
      { status: "expired" },
    );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const subscription = await Subscription.create({
      userId,
      plan,
      price,
      paymentId,
      startDate,
      endDate,
      status: "active",
    });

    // Flip the quick-check flag on the User document
    await User.findByIdAndUpdate(userId, { isPremium: true });

    return subscription;
  },

  /**
   * Get the currently active subscription for a user.
   * Returns null if no active subscription exists.
   */
  getActiveSubscription: async (userId) => {
    return Subscription.findOne({
      userId,
      status: "active",
      endDate: { $gte: new Date() },
    }).lean();
  },

  /**
   * Cancel an active subscription.
   * - Sets status to "cancelled" and records the cancellation time.
   * - Resets the user's isPremium flag.
   */
  cancelSubscription: async (userId) => {
    const subscription = await Subscription.findOneAndUpdate(
      { userId, status: "active" },
      { status: "cancelled", cancelledAt: new Date() },
      { new: true },
    );

    if (!subscription) {
      return null;
    }

    await User.findByIdAndUpdate(userId, { isPremium: false });

    return subscription;
  },

  /**
   * Check whether a user has an active, non-expired subscription.
   */
  hasActiveSubscription: async (userId) => {
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
      endDate: { $gte: new Date() },
    }).lean();

    return !!subscription;
  },

  /**
   * Expire all subscriptions whose endDate has passed.
   * Intended to be called by a scheduled cron job.
   */
  expireOverdueSubscriptions: async () => {
    const result = await Subscription.updateMany(
      { status: "active", endDate: { $lt: new Date() } },
      { status: "expired" },
    );

    // Also reset isPremium for the affected users
    if (result.modifiedCount > 0) {
      const expiredSubs = await Subscription.find({
        status: "expired",
        endDate: { $lt: new Date() },
      }).distinct("userId");

      await User.updateMany(
        { _id: { $in: expiredSubs } },
        { isPremium: false },
      );
    }

    return result.modifiedCount;
  },
};
