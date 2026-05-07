const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database configuration
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/matchmaking_db",

  // Security configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",

  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 0, //15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || "enhanced", // enhanced, detailed, simple, errors-only
  LOG_ERRORS_ONLY: process.env.LOG_ERRORS_ONLY === "true",
  LOG_SUCCESS_ONLY: process.env.LOG_SUCCESS_ONLY === "true",

  // Check if all required environment variables are set
  validate() {
    const requiredEnvVars = ["JWT_SECRET"];
    const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }
  },
};

module.exports = config;
