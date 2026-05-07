// Custom API Error class for consistent error handling
class APIError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;
  }

  // Create a 400 Bad Request error
  static badRequest(message = "Bad Request") {
    return new APIError(message, 400);
  }

  // Create a 401 Unauthorized error
  static unauthorized(message = "Unauthorized") {
    return new APIError(message, 401);
  }

  // Create a 403 Forbidden error
  static forbidden(message = "Forbidden") {
    return new APIError(message, 403);
  }

  // Create a 404 Not Found error
  static notFound(message = "Resource not found") {
    return new APIError(message, 404);
  }

  // Create a 409 Conflict error
  static conflict(message = "Conflict") {
    return new APIError(message, 409);
  }

  // Create a 422 Validation error
  static validation(message = "Validation Error") {
    return new APIError(message, 422);
  }

  // Create a 500 Internal Server error
  static internal(message = "Internal Server Error") {
    return new APIError(message, 500);
  }
}

module.exports = APIError;
