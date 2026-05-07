const config = require("../../config/config");
const APIError = require("../utils/APIError");

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (config.NODE_ENV === "development") {
    console.error(err);
  }

  if (!(error instanceof APIError)) {
    error = new APIError(error.message || "Internal Server Error", 500);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    status: error.statusCode >= 500 ? "error" : "fail",
    statusCode: error.statusCode,
  });
};

module.exports = errorHandler;
