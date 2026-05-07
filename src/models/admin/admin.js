const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Admin", AdminSchema);
