const { body, param, query } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const meetingValidator = {
  // Validate meeting request body
  requestMeeting: withErrorHandling([
    body("matchId")
      .notEmpty()
      .withMessage("Match ID is required")
      .isMongoId()
      .withMessage("Invalid match ID format"),
    body("location.address")
      .notEmpty()
      .withMessage("Location address is required")
      .isString()
      .isLength({ max: 300 })
      .withMessage("Address must be at most 300 characters"),
    body("location.lat")
      .notEmpty()
      .withMessage("Latitude is required")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude must be between -90 and 90"),
    body("location.lng")
      .notEmpty()
      .withMessage("Longitude is required")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude must be between -180 and 180"),
    body("dateTime")
      .notEmpty()
      .withMessage("Date and time is required")
      .isISO8601()
      .withMessage("Must be a valid ISO 8601 date"),
    body("notes")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Notes must be at most 500 characters"),
  ]),

  // Validate matchId param
  matchIdParam: withErrorHandling([
    param("matchId").isMongoId().withMessage("Invalid match ID format"),
  ]),
};

module.exports = { meetingValidator };
