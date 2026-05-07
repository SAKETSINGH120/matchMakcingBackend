const { body } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const feedbackValidator = {
  // Support ticket validation
  createTicket: withErrorHandling([
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isIn([
        "bug",
        "account_issue",
        "payment",
        "safety",
        "feature_request",
        "other",
      ])
      .withMessage(
        "Category must be bug, account_issue, payment, safety, feature_request, or other",
      ),

    body("subject")
      .notEmpty()
      .withMessage("Subject is required")
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage("Subject must be between 3 and 200 characters"),

    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ min: 10, max: 2000 })
      .withMessage("Message must be between 10 and 2000 characters"),
  ]),

  // Rating validation (partner + platform together)
  createRating: withErrorHandling([
    body("matchId").optional().isMongoId().withMessage("Invalid match ID"),

    body("partnerRating")
      .notEmpty()
      .withMessage("Partner rating is required")
      .isInt({ min: 1, max: 5 })
      .withMessage("Partner rating must be between 1 and 5"),

    body("platformRating")
      .notEmpty()
      .withMessage("Platform rating is required")
      .isInt({ min: 1, max: 5 })
      .withMessage("Platform rating must be between 1 and 5"),

    body("comment")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Comment must be under 1000 characters"),
  ]),
};

module.exports = { feedbackValidator };
