const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback/feedback");
const { feedbackValidator } = require("../controllers/feedback/validator");
const { authenticateUser } = require("../middlewares/auth");

router.use(authenticateUser);

// ── Support Tickets ──────────────────────────────────────
router.post(
  "/ticket",
  feedbackValidator.createTicket,
  feedbackController.createTicket,
);
router.get("/my-tickets", feedbackController.getMyTickets);

// ── Rating (partner + platform in one call) ──────────────
router.post(
  "/rate",
  feedbackValidator.createRating,
  feedbackController.createRating,
);
router.get("/my-ratings", feedbackController.getMyRatings);
router.get("/partner/:partnerId", feedbackController.getPartnerFeedback);
router.get("/platform-stats", feedbackController.getPlatformStats);

module.exports = router;
