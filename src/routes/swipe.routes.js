const express = require("express");
const router = express.Router();
const swipeController = require("../controllers/swipe/swipe");
const { swipeValidator } = require("../controllers/swipe/validator");
const { authenticateUser } = require("../middlewares/auth");

// All swipe routes require authentication
router.use(authenticateUser);

router.post("/discover", swipeController.discoverMatches);

router.post("/", swipeValidator.handleSwipe, swipeController.handleSwipe);

router.get("/matches", swipeValidator.getMatches, swipeController.getMatches);

router.get("/matches/pending", swipeController.getPendingMatches);

router.delete(
  "/matches/:matchId",
  swipeValidator.unmatch,
  swipeController.unmatch,
);

router.get("/likes", swipeController.getLikesReceived);

module.exports = router;
