const { param, query } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const chatValidator = {
  // Validate matchId param
  matchIdParam: withErrorHandling([
    param("matchId").isMongoId().withMessage("Invalid match ID format"),
  ]),

  // Validate matchId param + optional pagination query
  getChatHistory: withErrorHandling([
    param("matchId").isMongoId().withMessage("Invalid match ID format"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ]),
};

module.exports = { chatValidator };
