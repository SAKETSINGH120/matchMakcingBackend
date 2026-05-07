const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const config = require("../../config/config");

// Security middleware configuration
const securityMiddleware = {
  // Helmet for basic security headers
  helmet: helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },

    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "block-all-mixed-content": [],
        "font-src": ["'self'", "https:", "data:"],
        "frame-ancestors": ["'self'"],
        "img-src": ["'self'", "data:", "http:", "https:"],
        "object-src": ["'none'"],
        "script-src": ["'self'"],
        "script-src-attr": ["'none'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "upgrade-insecure-requests": [],
      },
    },
  }),

  // CORS configuration for cross-origin requests
  cors: cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),

  // Compression middleware for response compression
  compression: compression({
    level: 6,
    threshold: 1024, // Only compress files larger than 1KB
  }),

  // Rate limiting to prevent abuse
  rateLimit: rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: "Too many requests from this IP, please try again later.",
      status: 429,
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  }),

  // Body parser configuration
  bodyParser: {
    json: { limit: "10mb" },
    urlencoded: { extended: true, limit: "10mb" },
  },
};

module.exports = securityMiddleware;
