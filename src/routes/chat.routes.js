const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat/chat");
const { chatValidator } = require("../controllers/chat/validator");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateUser } = require("../middlewares/auth");

// All chat routes require authentication
router.use(authenticateUser);

// GET /api/chat/:matchId — get paginated chat history
router.get(
  "/:matchId",
  chatValidator.getChatHistory,
  asyncHandler(chatController.getChatHistory),
);

// PATCH /api/chat/:matchId/seen — mark messages as seen
router.patch(
  "/:matchId/seen",
  chatValidator.matchIdParam,
  asyncHandler(chatController.markAsSeen),
);

module.exports = router;
