const { body } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const adminEmailTemplateValidator = {
  upsert: withErrorHandling([
    body("subject")
      .trim()
      .notEmpty()
      .withMessage("Subject is required")
      .isLength({ min: 3, max: 200 })
      .withMessage("Subject must be between 3 and 200 characters"),
    body("introText")
      .trim()
      .notEmpty()
      .withMessage("Intro Text is required"),
    body("securityMessage")
      .trim()
      .notEmpty()
      .withMessage("Security Message is required"),
    body("buttonText")
      .trim()
      .notEmpty()
      .withMessage("Button Text is required"),
    body("helpMessage")
      .trim()
      .notEmpty()
      .withMessage("Help Message is required"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ]),

  preview: withErrorHandling([
    body("subject")
      .trim()
      .notEmpty()
      .withMessage("Subject is required")
      .isLength({ min: 3, max: 200 })
      .withMessage("Subject must be between 3 and 200 characters"),
    body("introText")
      .trim()
      .notEmpty()
      .withMessage("Intro Text is required"),
    body("securityMessage")
      .trim()
      .notEmpty()
      .withMessage("Security Message is required"),
    body("buttonText")
      .trim()
      .notEmpty()
      .withMessage("Button Text is required"),
    body("helpMessage")
      .trim()
      .notEmpty()
      .withMessage("Help Message is required"),
  ]),
};

module.exports = adminEmailTemplateValidator;
