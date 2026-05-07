const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscription/subscription");
const {
  subscriptionValidator,
} = require("../controllers/subscription/validator");
const { authenticateUser } = require("../middlewares/auth");

// Public — anyone can view available plans
router.get("/plans", subscriptionController.getPlans);

// All routes below require authentication
router.use(authenticateUser);

// POST /api/subscriptions — activate subscription after payment
router.post(
  "/",
  subscriptionValidator.createSubscription,
  subscriptionController.createSubscription,
);

// GET /api/subscriptions/me — get current user's active subscription
router.get("/me", subscriptionController.getMySubscription);

// POST /api/subscriptions/cancel — cancel active subscription
router.post("/cancel", subscriptionController.cancelSubscription);

module.exports = router;
