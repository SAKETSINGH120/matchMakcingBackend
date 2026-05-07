const mongoose = require("mongoose");

const REPORT_STATUSES = ["pending", "reviewed", "resolved", "dismissed"];

const ReportSchema = new mongoose.Schema(
  {
    // The user who filed the report
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The user being reported
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "inappropriate_content",
        "harassment",
        "fake_profile",
        "spam",
        "underage",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "pending",
    },
    // Admin notes when resolving
    adminNote: {
      type: String,
      maxlength: 500,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Fast lookup for pending reports and reports against a user
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reportedUser: 1, status: 1 });

// Prevent the same user from reporting another user more than once (while pending)
ReportSchema.index(
  { reportedBy: 1, reportedUser: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  },
);

module.exports = mongoose.model("Report", ReportSchema);
