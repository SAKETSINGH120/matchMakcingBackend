const { body, param, query, validationResult } = require("express-validator");
const APIResponse = require("./APIResponse");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(" || ");
    return APIResponse.send(res, false, 400, errorMessages);
  }
  next();
};

const withErrorHandling = (validationRules) => {
  return [...validationRules, handleValidationErrors];
};

const validator = {
  mongoId: (fieldName = "id") =>
    withErrorHandling([
      param(fieldName).isMongoId().withMessage(`Invalid ${fieldName} format`),
    ]),

  pagination: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
  ]),

  coordinates: withErrorHandling([
    query("latitude")
      .notEmpty()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude required"),
    query("longitude")
      .notEmpty()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude required"),
    query("maxDistance")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Distance must be 1-1000 km"),
  ]),

  preferences: withErrorHandling([
    body("interestedIn")
      .optional()
      .isIn(["male", "female", "everyone"])
      .withMessage("Invalid interested in value"),
    body("minAge")
      .optional()
      .isInt({ min: 18, max: 100 })
      .withMessage("Min age must be 18-100"),
    body("maxAge")
      .optional()
      .isInt({ min: 18, max: 100 })
      .withMessage("Max age must be 18-100"),
    body("maxDistanceKm")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Max distance must be 1-1000 km"),
  ]),

  verifyOTP: withErrorHandling([
    body("number")
      .notEmpty()
      .isMobilePhone()
      .withMessage("Valid phone number required"),
    body("otp")
      .isLength({ min: 4, max: 4 })
      .isNumeric()
      .withMessage("OTP must be 4 digits"),
  ]),

  resendOTP: withErrorHandling([
    body("number")
      .notEmpty()
      .isMobilePhone()
      .withMessage("Valid phone number required"),
  ]),
};

module.exports = { validator, withErrorHandling, handleValidationErrors };
