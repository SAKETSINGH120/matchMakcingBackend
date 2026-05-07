const { query } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const feedValidator = {
  // Validate optional pagination query params for the feed
  getFeed: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ]),
};

module.exports = { feedValidator };
