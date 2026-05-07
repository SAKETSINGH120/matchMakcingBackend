const mongoose = require("mongoose");
const config = require("./config");

class Database {
  constructor() {
    this._connect();
  }

  // Connect to MongoDB database
  _connect() {
    mongoose
      .connect(config.MONGODB_URI, {
        // These options ensure a stable connection
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      })
      .then(() => {
        console.log("Database connection established successfully");
      })
      .catch((err) => {
        console.error("Database connection error:", err.message);
        console.log("Server will continue running without database connection");
        // Don't exit the process - let the server run without database
        // process.exit(1);
      });

    // Listen for connection events
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected from MongoDB");
    });

    // Handle application termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("Database connection closed due to application termination");
      process.exit(0);
    });
  }

  // Get the current connection status
  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  // Close the database connection
  async disconnect() {
    await mongoose.connection.close();
  }
}

module.exports = new Database();
