const { body, param, query } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const swipeValidator = {
  // Validate swipe request body
  handleSwipe: withErrorHandling([
    body("toUser")
      .notEmpty()
      .withMessage("Target user ID is required")
      .isMongoId()
      .withMessage("Invalid target user ID format"),

    body("action")
      .notEmpty()
      .withMessage("Swipe action is required")
      .isIn(["like", "dislike", "superlike"])
      .withMessage("Action must be 'like', 'dislike', or 'superlike'"),
  ]),

  // Validate unmatch request
  unmatch: withErrorHandling([
    param("matchId")
      .notEmpty()
      .withMessage("Match ID is required")
      .isMongoId()
      .withMessage("Invalid match ID format"),
  ]),

  // Validate getMatches query (optional type filter)
  getMatches: withErrorHandling([
    query("type")
      .optional()
      .isIn(["swipe", "system"])
      .withMessage("Type must be 'swipe' or 'system'"),
  ]),
};

module.exports = { swipeValidator };
