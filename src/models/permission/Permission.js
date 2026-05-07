const mongoose = require("mongoose");

const PermissionSchema = new mongoose.Schema(
  {
    // Section name like "users", "dashboard", "subscriptions", etc.
    sectionName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Toggle entire section on/off
    isSection: {
      type: Boolean,
      default: false,
    },

    // CRUD flags
    isCreate: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isUpdate: {
      type: Boolean,
      default: false,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Permission", PermissionSchema);
