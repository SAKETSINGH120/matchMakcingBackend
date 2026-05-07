// Standardized API Response utility
// This ensures all API responses follow a consistent format
class APIResponse {
  // Main response method - handles both success and error responses
  static send(
    res,
    success = true,
    statusCode = 200,
    message = "Operation completed",
    data = null,
    meta = null,
  ) {
    const response = {
      success,
      message,
    };

    // Add data if provided
    if (data !== null) {
      response.data = data;
    }

    // Add metadata if provided (useful for pagination)
    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  // Convenience method for success responses
  static success(
    res,
    data = null,
    message = "Operation successful",
    statusCode = 200,
    meta = null,
  ) {
    return this.send(res, true, statusCode, message, data, meta);
  }

  // Convenience method for error responses
  static error(res, error, statusCode = null) {
    const status = error.statusCode || statusCode || 500;
    const message = error.message || "An error occurred";
    return this.send(res, false, status, message);
  }

  // Convenience method for paginated responses
  static paginated(
    res,
    data,
    pagination,
    message = "Data retrieved successfully",
  ) {
    const paginationMeta = {
      currentPage: pagination.currentPage || 1,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || 0,
      itemsPerPage: pagination.itemsPerPage || 10,
      hasNextPage: pagination.hasNextPage || false,
      hasPrevPage: pagination.hasPrevPage || false,
    };

    return this.send(res, true, 200, message, data, {
      pagination: paginationMeta,
    });
  }
}

module.exports = APIResponse;
