const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    compatibilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    matchType: {
      type: String,
      enum: ["swipe", "system"],
      default: "swipe",
    },

    // ── Moderation ─────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "unmatched", "blocked"],
      default: "pending",
    },
    chatEnabled: {
      type: Boolean,
      default: false,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    moderatedAt: Date,
    adminNote: {
      type: String,
      maxlength: 500,
    },

    // ── Meeting (embedded in match for simplicity) ─────────
    meeting: {
      proposedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      location: {
        address: {
          type: String,
          trim: true,
          maxlength: 300,
        },
        lat: {
          type: Number,
          min: -90,
          max: 90,
        },
        lng: {
          type: Number,
          min: -180,
          max: 180,
        },
      },
      dateTime: Date,
      notes: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      },
      moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      moderatedAt: Date,
      adminNote: {
        type: String,
        maxlength: 500,
      },
    },

    unmatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    unmatchedAt: Date,
  },
  { timestamps: true },
);

MatchSchema.index({ users: 1 });
MatchSchema.index({ users: 1, status: 1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ "meeting.status": 1 });

module.exports = mongoose.model("Match", MatchSchema);
