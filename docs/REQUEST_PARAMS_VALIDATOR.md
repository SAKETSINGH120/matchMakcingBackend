# Simple Request Validator

Easy and clean validation for Express.js routes with **automatic error handling**.

## Usage

```javascript
const {
  validator,
  withErrorHandling,
} = require("../utils/requestParamsValidator");
```

## ✨ Automatic Error Handling

All validators automatically handle validation errors - no need to manually add `handleValidationErrors`!

### Before (Complex):

```javascript
// Old way - manual error handling required
const validation = [
  body("name").notEmpty(),
  body("email").isEmail(),
  handleValidationErrors, // ← Had to add this manually
];
```

### After (Simple):

```javascript
// New way - automatic error handling
const validation = withErrorHandling([
  body("name").notEmpty(),
  body("email").isEmail(),
]);

// Built-in validators already have automatic error handling
validator.mongoId("id");
```

## Available Validators

### 1. MongoDB ID

```javascript
// Validates :id parameter
router.get("/:id", validator.mongoId("id"), controller.getUser);

// Validates :userId parameter
router.get("/:userId", validator.mongoId("userId"), controller.getUser);
```

### 2. Pagination

```javascript
// Validates page, limit query parameters
router.get("/users", validator.pagination, controller.getUsers);
```

### 3. Location Coordinates

```javascript
// Validates latitude, longitude, maxDistance in query
router.get("/search/nearby", validator.coordinates, controller.searchNearby);
```

### 4. User Preferences

```javascript
// Validates interestedIn, minAge, maxAge, maxDistanceKm in body
router.put("/preferences", validator.preferences, controller.updatePreferences);
```

## Examples

### User Routes

```javascript
// Get user by ID
router.get(
  "/:id",
  validator.mongoId("id"),
  asyncHandler(controller.getUserById),
);

// Get users with pagination
router.get("/", validator.pagination, asyncHandler(controller.getAllUsers));

// Search nearby users
router.get(
  "/search/nearby",
  validator.coordinates,
  asyncHandler(controller.searchNearby),
);

// Update preferences
router.put(
  "/:id/preferences",
  validator.mongoId("id"),
  validator.preferences,
  asyncHandler(controller.updatePreferences),
);
```

### Request Examples

**Pagination Query:**

```
GET /api/users?page=1&limit=10
```

**Coordinates Query:**

```
GET /api/users/search/nearby?latitude=37.7749&longitude=-122.4194&maxDistance=50
```

**Preferences Body:**

```json
{
  "interestedIn": "female",
  "minAge": 25,
  "maxAge": 35,
  "maxDistanceKm": 100
}
```

## Create Custom Validators

Use the `withErrorHandling` utility to create your own validators with automatic error handling:

```javascript
const { withErrorHandling } = require("../utils/requestParamsValidator");

// Custom validation with automatic error handling
const customValidator = withErrorHandling([
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("age").isInt({ min: 18 }).withMessage("Must be at least 18"),
]);

router.post("/register", customValidator, controller.register);
```

## Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "latitude",
      "message": "Valid latitude required",
      "value": "invalid_value"
    }
  ]
}
```

## Benefits

- ✅ **No manual error handling** - all validators have automatic error handling
- ✅ **Clean code** - no more repetitive `handleValidationErrors`
- ✅ **Simple usage** - just use `validator.functionName`
- ✅ **Custom validators** - use `withErrorHandling()` for custom validation arrays

That's it! Simple, clean validation with automatic error handling.
