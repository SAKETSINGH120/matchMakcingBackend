const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: Date,
  },
  { timestamps: true },
);

// Indexes for fast chat history lookups
MessageSchema.index({ matchId: 1, createdAt: -1 });
MessageSchema.index({ matchId: 1, seen: 1 });

module.exports = mongoose.model("Message", MessageSchema);
