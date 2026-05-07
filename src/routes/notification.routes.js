const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification/notification");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateUser } = require("../middlewares/auth");
const { validator } = require("../utils/requestParamsValidator");

router.get(
  "/",
  authenticateUser,
  asyncHandler(notificationController.getNotifications),
);

router.get(
  "/unread-count",
  authenticateUser,
  asyncHandler(notificationController.getUnreadCount),
);

router.patch(
  "/:id/read",
  authenticateUser,
  validator.mongoId("id"),
  asyncHandler(notificationController.markAsRead),
);

router.patch(
  "/read-all",
  authenticateUser,
  asyncHandler(notificationController.markAllAsRead),
);

module.exports = router;
