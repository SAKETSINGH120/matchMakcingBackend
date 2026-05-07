const { body, param } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const cmsValidator = {
  // Validate pageType param
  pageTypeParam: withErrorHandling([
    param("pageType")
      .notEmpty()
      .withMessage("Page type is required")
      .isIn(["privacy-policy", "terms-and-conditions", "about-us", "help"])
      .withMessage("Invalid page type"),
  ]),

  // Validate create/update page (admin)
  createOrUpdate: withErrorHandling([
    body("pageType")
      .notEmpty()
      .withMessage("Page type is required")
      .isIn(["privacy-policy", "terms-and-conditions", "about-us", "help"])
      .withMessage("Invalid page type"),

    body("content")
      .notEmpty()
      .withMessage("Content is required")
      .isLength({ min: 10 })
      .withMessage("Content must be at least 10 characters"),

    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ]),
};

module.exports = cmsValidator;
