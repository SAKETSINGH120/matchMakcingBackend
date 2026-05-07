const express = require("express");
const router = express.Router();

// Import route modules
const userRoutes = require("./user.routes");
const adminRoutes = require("./admin.routes");
const swipeRoutes = require("./swipe.routes");
const feedRoutes = require("./feed.routes");
const subscriptionRoutes = require("./subscription.routes");
const feedbackRoutes = require("./feedback.routes");
const meetingRoutes = require("./meeting.routes");
const chatRoutes = require("./chat.routes");
const cmsRoutes = require("./cms.routes");
const notificationRoutes = require("./notification.routes");
const asyncHandler = require("../utils/asyncHandler");

// Health check
router.get(
  "/health",
  asyncHandler((req, res) => {
    return res.json({
      success: true,
      message: "Server is running and healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  }),
);

// route modules
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/swipes", swipeRoutes);
router.use("/feed", feedRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/meetings", meetingRoutes);
router.use("/chat", chatRoutes);
router.use("/cms", cmsRoutes);
router.use("/notification", notificationRoutes);

module.exports = router;
