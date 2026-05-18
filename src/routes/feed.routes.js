const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feed/feed");
const { feedValidator } = require("../controllers/feed/validator");
const { authenticateUser } = require("../middlewares/auth");

router.use(authenticateUser);

router.get("/", feedValidator.getFeed, feedController.getFeed);

router.get(
  "/admin-suggested",
  feedValidator.getFeed,
  feedController.getAdminSuggestedFeed,
);

router.get("/:feedId", feedValidator.getFeed, feedController.getFeedDetails);

module.exports = router;
