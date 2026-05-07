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
    body("body")
      .notEmpty()
      .withMessage("Body is required")
      .isString()
      .withMessage("Body must be a string")
      .isLength({ min: 10 })
      .withMessage("Body must be at least 10 characters"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ]),
};

module.exports = adminEmailTemplateValidator;
