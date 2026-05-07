const mongoose = require("mongoose");

const adminSuggestedProfilesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
    required: true,
    index: true,
  },

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },

  priority: {
    type: Number,
    default: 1,
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

adminSuggestedProfilesSchema.index(
  { userId: 1, profileId: 1 },
  { unique: true },
);

const AdminSuggestedProfiles = mongoose.model(
  "adminSuggestedProfiles",
  adminSuggestedProfilesSchema,
);

module.exports = AdminSuggestedProfiles;
