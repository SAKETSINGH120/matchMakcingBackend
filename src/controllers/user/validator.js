const { body, param } = require("express-validator");
const {
  withErrorHandling,
  handleValidationErrors,
} = require("../../utils/requestParamsValidator");

const userValidator = {
  // Register user validation
  registerUser: withErrorHandling([
    body("name")
      .trim()
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("number")
      .notEmpty()
      .withMessage("Number is required")
      .isMobilePhone()
      .withMessage("Please provide a valid phone number")
      .isLength({ min: 9, max: 16 })
      .withMessage("Phone number must be between 10 and 15 digits"),

    body("dob")
      .optional()
      .isISO8601()
      .withMessage("Please provide a valid date of birth in YYYY-MM-DD format")
      .custom((value) => {
        const dob = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 18 || age > 100) {
          throw new Error("Age must be between 18 and 100 years");
        }
        return true;
      }),

    body("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be either male, female, or other"),

    body("bio")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),

    body("education")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Education cannot exceed 200 characters"),

    body("profession")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Profession cannot exceed 100 characters"),

    body("company")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Company name cannot exceed 100 characters"),

    body("heightCm")
      .optional()
      .isInt({ min: 100, max: 250 })
      .withMessage("Height must be between 100 and 250 cm"),

    body("languages")
      .optional()
      .isArray()
      .withMessage("Languages must be an array")
      .custom((languages) => {
        if (languages && languages.length > 10) {
          throw new Error("Cannot specify more than 10 languages");
        }
        return true;
      }),

    body("languages.*")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Each language must be between 2 and 50 characters"),

    body("password")
      .optional()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      )
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      ),

    body("interests")
      .optional()
      .isArray()
      .withMessage("Interests must be an array")
      .custom((interests) => {
        if (interests && interests.length > 20) {
          throw new Error("Cannot specify more than 20 interests");
        }
        return true;
      }),

    body("interests.*")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Each interest must be between 2 and 50 characters"),

    // Preferences validation (nested object)
    body("preferences.interestedIn")
      .optional()
      .isIn(["male", "female", "everyone"])
      .withMessage("Interested in must be either male, female, or everyone"),

    body("preferences.minAge")
      .optional()
      .isInt({ min: 18, max: 100 })
      .withMessage("Minimum age must be between 18 and 100"),

    body("preferences.maxAge")
      .optional()
      .isInt({ min: 18, max: 100 })
      .withMessage("Maximum age must be between 18 and 100")
      .custom((value, { req }) => {
        if (
          req.body.preferences?.minAge &&
          value < req.body.preferences.minAge
        ) {
          throw new Error("Maximum age must be greater than minimum age");
        }
        return true;
      }),

    body("preferences.maxDistanceKm")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Maximum distance must be between 1 and 1000 km"),

    // Location validation (nested object)
    body("location.coordinates")
      .optional()
      .isArray({ min: 2, max: 2 })
      .withMessage(
        "Coordinates must be an array with exactly 2 elements [longitude, latitude]",
      ),

    body("location.coordinates.*")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Coordinates must be valid longitude and latitude values"),

    body("location.city")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("City must be between 2 and 100 characters"),

    body("location.country")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Country must be between 2 and 100 characters"),

    // Privacy settings validation (nested object)
    body("privacy.showAge")
      .optional()
      .isBoolean()
      .withMessage("Show age must be a boolean value"),

    body("privacy.showDistance")
      .optional()
      .isBoolean()
      .withMessage("Show distance must be a boolean value"),
  ]),

  // Update user validation
  updateUser: withErrorHandling([
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("dob")
      .optional()
      .isISO8601()
      .withMessage("Please provide a valid date of birth in YYYY-MM-DD format")
      .custom((value) => {
        const dob = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 18 || age > 100) {
          throw new Error("Age must be between 18 and 100 years");
        }
        return true;
      }),

    body("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be either male, female, or other"),

    body("bio")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),

    body("education")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Education cannot exceed 200 characters"),

    body("profession")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Profession cannot exceed 100 characters"),

    body("company")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Company name cannot exceed 100 characters"),

    body("heightCm")
      .optional()
      .isInt({ min: 100, max: 250 })
      .withMessage("Height must be between 100 and 250 cm"),

    body("languages")
      .optional()
      .isArray()
      .withMessage("Languages must be an array")
      .custom((languages) => {
        if (languages && languages.length > 10) {
          throw new Error("Cannot specify more than 10 languages");
        }
        return true;
      }),

    body("languages.*")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Each language must be between 2 and 50 characters"),

    body("interests")
      .optional()
      .isArray()
      .withMessage("Interests must be an array")
      .custom((interests) => {
        if (interests && interests.length > 20) {
          throw new Error("Cannot specify more than 20 interests");
        }
        return true;
      }),

    body("interests.*")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Each interest must be between 2 and 50 characters"),

    // Lifestyle validation (nested object)
    body("lifestyle.drinking")
      .optional()
      .isIn(["never", "rarely", "socially", "regularly"])
      .withMessage(
        "Drinking must be one of: never, rarely, socially, regularly",
      ),

    body("lifestyle.smoking")
      .optional()
      .isIn(["never", "occasionally", "regularly"])
      .withMessage("Smoking must be one of: never, occasionally, regularly"),

    body("lifestyle.workout")
      .optional()
      .isIn(["never", "sometimes", "often", "daily"])
      .withMessage("Workout must be one of: never, sometimes, often, daily"),

    body("lifestyle.diet")
      .optional()
      .isIn(["veg", "non-veg", "vegan", "no-preference"])
      .withMessage("Diet must be one of: veg, non-veg, vegan, no-preference"),

    // Relationship goal validation
    body("relationshipGoal")
      .optional()
      .isIn(["casual", "serious", "friendship", "marriage"])
      .withMessage(
        "Relationship goal must be one of: casual, serious, friendship, marriage",
      ),

    // Preferences validation (nested object)
    body("preferences.interestedIn")
      .optional()
      .isIn(["male", "female", "everyone"])
      .withMessage("Interested in must be either male, female, or everyone"),

    body("preferences.minAge")
      .optional()
      .isInt({ min: 18, max: 100 })
      .withMessage("Minimum age must be between 18 and 100"),

    body("preferences.maxAge")
      .optional()
      .isInt({ min: 18, max: 100 })
      .withMessage("Maximum age must be between 18 and 100")
      .custom((value, { req }) => {
        if (
          req.body.preferences?.minAge &&
          value < req.body.preferences.minAge
        ) {
          throw new Error("Maximum age must be greater than minimum age");
        }
        return true;
      }),

    body("preferences.maxDistanceKm")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Maximum distance must be between 1 and 1000 km"),

    // Location validation (nested object)
    body("location.coordinates")
      .optional()
      .isArray({ min: 2, max: 2 })
      .withMessage(
        "Coordinates must be an array with exactly 2 elements [longitude, latitude]",
      ),

    body("location.coordinates.*")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Coordinates must be valid longitude and latitude values"),

    body("location.city")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("City must be between 2 and 100 characters"),

    body("location.country")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Country must be between 2 and 100 characters"),

    // Privacy settings validation (nested object)
    body("privacy.showAge")
      .optional()
      .isBoolean()
      .withMessage("Show age must be a boolean value"),

    body("privacy.showDistance")
      .optional()
      .isBoolean()
      .withMessage("Show distance must be a boolean value"),
  ]),

  userLogin: withErrorHandling([
    body("userID")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("userID cannot be empty"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ]),

  changePasswordValidator: withErrorHandling([
    body("currentPassword")
      .trim()
      .notEmpty()
      .withMessage("currentPassword cannot be empty"),
    body("newPassword")
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 10 })
      .withMessage("new password legth must be 8 to 10 charcter")
      // .matches(
      //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      // )
      // .withMessage(
      //   "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      // ),
  ]),
};

// Common validation for user-related routes
const userCommonValidator = {
  // Validate MongoDB ObjectId for user ID parameter
  userId: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid user ID format"),
  ]),
};

module.exports = {
  userValidator,
  userCommonValidator,
  handleValidationErrors,
};
