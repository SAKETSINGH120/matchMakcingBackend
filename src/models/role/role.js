const mongoose = require("mongoose");

// Embedded permission subdocument — one per section
const PermissionSubSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isCreate: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    isUpdate: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
  },
  { _id: false },
);

const RoleModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Permissions embedded directly — no separate collection needed
    permissions: [PermissionSubSchema],
    // true for system roles (super_admin, admin, moderator) — cannot be deleted
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Role", RoleModelSchema);
