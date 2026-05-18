const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscription/subscription");
const {
  subscriptionValidator,
} = require("../controllers/subscription/validator");
const { authenticateUser } = require("../middlewares/auth");

router.get("/plans", subscriptionController.getPlans);

router.use(authenticateUser);

router.post(
  "/",
  subscriptionValidator.createSubscription,
  subscriptionController.createSubscription,
);

router.get("/me", subscriptionController.getMySubscription);

router.post("/cancel", subscriptionController.cancelSubscription);

module.exports = router;
