const express = require("express");
const router = express.Router();
const meetingController = require("../controllers/meeting/meeting");
const { meetingValidator } = require("../controllers/meeting/validator");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateUser } = require("../middlewares/auth");

// router.use(authenticateUser);

router.get("/", asyncHandler(meetingController.getMyMeetings));

router.post(
  "/",
  meetingValidator.requestMeeting,
  asyncHandler(meetingController.requestMeeting),
);

router.get(
  "/:matchId",
  meetingValidator.matchIdParam,
  asyncHandler(meetingController.getMeeting),
);

router.patch(
  "/:matchId/cancel",
  meetingValidator.matchIdParam,
  asyncHandler(meetingController.cancelMeeting),
);

module.exports = router;
