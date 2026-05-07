const mongoose = require("mongoose");

/**
 * CMS Model for managing static content pages
 */
const CMSSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      enum: ["privacy-policy", "terms-and-conditions", "about-us", "help"],
    },
    content: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
CMSSchema.index({ pageType: 1, isActive: 1 });

const CMS = mongoose.model("CMS", CMSSchema);

module.exports = CMS;
