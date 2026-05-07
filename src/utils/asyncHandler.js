// Async error wrapper to handle promise rejections
// This eliminates the need for try-catch blocks in every async controller
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
