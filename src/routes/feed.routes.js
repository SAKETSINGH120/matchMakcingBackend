const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feed/feed");
const { feedValidator } = require("../controllers/feed/validator");
const { authenticateUser } = require("../middlewares/auth");

// All feed routes require authentication
router.use(authenticateUser);

// GET /api/feed — get suggested users for the current user
router.get("/", feedValidator.getFeed, feedController.getFeed);

// GET /api/feed/admin-suggested — get admin-assigned profiles for the current user
router.get(
  "/admin-suggested",
  feedValidator.getFeed,
  feedController.getAdminSuggestedFeed,
);

router.get("/:feedId", feedValidator.getFeed, feedController.getFeedDetails);

module.exports = router;
