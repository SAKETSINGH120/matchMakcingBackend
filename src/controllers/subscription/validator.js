const { body } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const subscriptionValidator = {
  // Validate subscription creation request
  createSubscription: withErrorHandling([
    body("plan")
      .notEmpty()
      .withMessage("Plan is required")
      .isIn(["basic", "gold", "platinum"])
      .withMessage("Plan must be basic, gold, or platinum"),

    body("paymentId")
      .notEmpty()
      .withMessage("Payment ID is required")
      .isString()
      .withMessage("Payment ID must be a string")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Payment ID must be between 1 and 200 characters"),
  ]),
};

module.exports = { subscriptionValidator };
