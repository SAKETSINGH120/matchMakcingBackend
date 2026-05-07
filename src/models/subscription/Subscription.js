const mongoose = require("mongoose");

// Available subscription plans — easy to extend later
const PLAN_NAMES = ["basic", "gold", "platinum"];
const SUBSCRIPTION_STATUSES = ["active", "expired", "cancelled"];

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: PLAN_NAMES,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    // Reference ID from the payment gateway (Stripe, Razorpay, etc.)
    paymentId: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: "active",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Fast lookup: get a user's active subscription
SubscriptionSchema.index({ userId: 1, status: 1 });

// Prevent duplicate active subscriptions for the same user
SubscriptionSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

// Useful for cron jobs that expire subscriptions past their endDate
SubscriptionSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model("Subscription", SubscriptionSchema);
