const express = require("express");
const securityMiddleware = require("./src/middlewares/security");
const logger = require("./src/middlewares/logger");
const errorHandler = require("./src/middlewares/errorHandler");
const routes = require("./src/routes");
const config = require("./config/config");
const path = require("path");

// Initialize Express application
const app = express();

// Trust proxy (important for production behind reverse proxy)
app.set("trust proxy", 1);

// Apply security middleware
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.cors);
app.use(securityMiddleware.compression);
app.use(securityMiddleware.rateLimit);

// Enhanced API logging middleware
const getLoggerMiddleware = () => {
  if (config.LOG_ERRORS_ONLY) return logger.errorOnly;
  if (config.LOG_SUCCESS_ONLY) return logger.successOnly;

  switch (config.LOG_LEVEL.toLowerCase()) {
    case "detailed":
      return logger.detailed;
    case "simple":
      return logger.simple;
    case "enhanced":
    default:
      return logger.enhanced;
  }
};

app.use("/public", express.static(path.join(__dirname, "./public")));

app.use(getLoggerMiddleware());

// Body parsing middleware
app.use(express.json(securityMiddleware.bodyParser.json));
app.use(express.urlencoded(securityMiddleware.bodyParser.urlencoded));

// Health check endpoint (before other routes)A
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Matchmaking Backend API is running",
    version: "1.0.0",
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API routes with versioning
app.use("/api/v1", routes);

// Global error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
