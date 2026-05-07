const http = require("http");
const app = require("./app");
const config = require("./config/config");
const database = require("./config/database");
const initSocket = require("./src/socket/index");

// Validate environment variables
try {
  config.validate();
  console.log("Environment variables validated successfully");
} catch (error) {
  console.error("Environment validation failed:", error.message);
  process.exit(1);
}

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = initSocket(server, app);

server.listen(config.PORT, () => {
  console.log("Server started successfully");
  console.log(`Server running on port ${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log("Socket.io initialized");

  if (config.NODE_ENV === "development") {
    console.log(`Server URL: http://localhost:${config.PORT}`);
    console.log(`Health Check: http://localhost:${config.PORT}/api/v1/health`);
  }
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}, starting graceful shutdown...`);

  server.close(() => {
    console.log("HTTP server closed");

    // Close database connection
    if (database.isConnected()) {
      database
        .disconnect()
        .then(() => {
          console.log("Database connection closed");
          console.log("Graceful shutdown completed");
          process.exit(0);
        })
        .catch((error) => {
          console.error("Error during database disconnection:", error);
          process.exit(1);
        });
    } else {
      console.log("Graceful shutdown completed");
      process.exit(0);
    }
  });

  // Force close server after 30 seconds
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 30000);
};

// Listen for shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Handle process warnings
process.on("warning", (warning) => {
  console.warn("Process Warning:", warning);
});

// Export server for testing purposes
module.exports = server;
