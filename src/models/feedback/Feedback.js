const mongoose = require("mongoose");

const FEEDBACK_TYPES = ["support_ticket", "rating"];

const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];
const TICKET_CATEGORIES = [
  "bug",
  "account_issue",
  "payment",
  "safety",
  "feature_request",
  "other",
];

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: FEEDBACK_TYPES,
      required: true,
    },

    // ── Support ticket fields ──────────────────────────────
    category: { type: String, enum: TICKET_CATEGORIES },
    subject: { type: String, trim: true, maxlength: 200 },
    message: { type: String, maxlength: 2000 },
    status: { type: String, enum: TICKET_STATUSES, default: "open" },
    adminReply: { type: String, maxlength: 2000, default: null },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    repliedAt: { type: Date, default: null },

    // ── Rating fields (both submitted together in one call) ─
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
    partnerRating: { type: Number, min: 1, max: 5 },
    platformRating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true },
);

FeedbackSchema.index({ type: 1, createdAt: -1 });
FeedbackSchema.index({ userId: 1, type: 1 });
FeedbackSchema.index({ status: 1, createdAt: -1 });

// Prevent same user from rating the same match twice
FeedbackSchema.index(
  { userId: 1, matchId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: "rating" } },
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
