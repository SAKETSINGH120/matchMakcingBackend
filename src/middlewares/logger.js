const morgan = require("morgan");
const chalk = require("chalk");
const config = require("../../config/config");

// Custom token for colored status codes
morgan.token("status-colored", (req, res) => {
  const status = res.statusCode;
  const color =
    status >= 500
      ? "red" // Server errors
      : status >= 400
        ? "yellow" // Client errors
        : status >= 300
          ? "cyan" // Redirects
          : "green"; // Success
  return chalk[color](status);
});

// Custom token for colored method
morgan.token("method-colored", (req) => {
  const method = req.method;
  const color =
    {
      GET: "green",
      POST: "blue",
      PUT: "yellow",
      DELETE: "red",
      PATCH: "magenta",
      OPTIONS: "gray",
    }[method] || "white";
  return chalk[color](method);
});

// Custom token for response time with colors
morgan.token("response-time-colored", (req, res) => {
  const responseTime = morgan["response-time"](req, res);
  const time = parseFloat(responseTime);
  const color =
    time > 1000
      ? "red" // Slow (>1s)
      : time > 500
        ? "yellow" // Medium (500ms-1s)
        : "green"; // Fast (<500ms)
  return chalk[color](`${responseTime} ms`);
});

// Custom token for request timestamp
morgan.token("timestamp", () => {
  return chalk.gray(new Date().toISOString());
});

// Custom token for content length
morgan.token("content-length-colored", (req, res) => {
  const length = morgan["res"](req, res, "content-length");
  return length ? chalk.cyan(`${length} bytes`) : chalk.gray("- bytes");
});

// Custom token for user agent (shortened)
morgan.token("user-agent-short", (req) => {
  const userAgent = req.get("User-Agent") || "";
  // Extract browser/client name
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("curl")) return "curl";
  if (userAgent.includes("Postman")) return "Postman";
  if (userAgent.includes("Insomnia")) return "Insomnia";
  return "Unknown";
});

// Enhanced development format with colors and better visibility
const devFormat = [
  ":method-colored",
  chalk.white(":url"),
  ":status-colored",
  ":response-time-colored",
].join(" ");

// Production format (no colors, structured for parsing)
const prodFormat = [
  ":remote-addr",
  ":method",
  ":url",
  ":status",
  ":response-time ms",
].join(" | ");

// Request details format for debugging
const detailedFormat = [
  chalk.blue.bold("\n🔍 REQUEST DETAILS:"),
  chalk.gray("Time:") + " :timestamp",
  chalk.gray("Method:") + " :method-colored",
  chalk.gray("URL:") + " " + chalk.white(":url"),
  chalk.gray("IP:") + " " + chalk.cyan(":remote-addr"),
  chalk.gray("User-Agent:") + " " + chalk.yellow(":user-agent-short"),
  chalk.gray("Status:") + " :status-colored",
  chalk.gray("Response Time:") + " :response-time-colored",
  chalk.gray("Content Length:") + " :content-length-colored",
  chalk.blue("─".repeat(60)),
].join("\n");

// Logger middleware based on environment
const loggerMiddleware = {
  // Standard enhanced logging
  enhanced: morgan(config.NODE_ENV === "production" ? prodFormat : devFormat),

  // Detailed logging for debugging (can be toggled)
  detailed: morgan(detailedFormat),

  // Simple clean format
  simple: morgan(":method-colored :url :status-colored :response-time-colored"),

  // Error logging only
  errorOnly: morgan(devFormat, {
    skip: (req, res) => res.statusCode < 400,
  }),

  // Success logging only
  successOnly: morgan(devFormat, {
    skip: (req, res) => res.statusCode >= 400,
  }),
};

module.exports = loggerMiddleware;
