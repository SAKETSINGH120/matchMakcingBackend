const mongoose = require("mongoose");

const SwipeSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["like", "dislike", "superlike"],
      required: true,
    },
  },
  { timestamps: true },
);

// Ensure a user can only swipe once on another user
SwipeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

// Index for quick lookups when checking mutual likes
SwipeSchema.index({ toUser: 1, fromUser: 1, action: 1 });

// TTL index: auto-remove dislikes after 30 days so users can resurface
SwipeSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { action: "dislike" },
  },
);

module.exports = mongoose.model("Swipe", SwipeSchema);
