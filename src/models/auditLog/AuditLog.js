const mongoose = require("mongoose");

/**
 * AuditLog — records every significant admin action.
 * Useful for accountability, debugging, and compliance.
 */
const AuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      // Examples: "block_user", "unblock_user", "cancel_subscription",
      //           "resolve_report", "reply_ticket", "activate_subscription"
    },
    targetType: {
      type: String,
      enum: ["user", "subscription", "report", "feedback", "match"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Store a snapshot of what changed (optional but helpful)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Query logs by admin, target, or time range
AuditLogSchema.index({ adminId: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
