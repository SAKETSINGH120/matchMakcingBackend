const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat/chat");
const { chatValidator } = require("../controllers/chat/validator");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateUser } = require("../middlewares/auth");

router.use(authenticateUser);

router.get(
  "/:matchId",
  chatValidator.getChatHistory,
  asyncHandler(chatController.getChatHistory),
);

router.patch(
  "/:matchId/seen",
  chatValidator.matchIdParam,
  asyncHandler(chatController.markAsSeen),
);

module.exports = router;
