const User = require("../models/user/User");
const Admin = require("../models/admin/admin");
const APIError = require("../utils/APIError");
const asyncHandler = require("../utils/asyncHandler");
const { MESSAGES } = require("../constants");
const { verifyToken } = require("../utils/jwtUtils");

const extractToken = (req) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token && req.headers["x-auth-token"]) {
    token = req.headers["x-auth-token"];
  }

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token;
};

const authenticateUser = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw APIError.unauthorized(MESSAGES.UNAUTHORIZED);
  }

  const decoded = await verifyToken(token);
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw APIError.unauthorized("User no longer exists");
  }

  if (user.status !== "active") {
    throw APIError.forbidden("Account has been deactivated");
  }

  req.user = user;
  req.token = token;

  next();
});

// Authenticate admin and populate role + permissions
const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  console.log("🚀 ~ token:", token, typeof token);

  if (!token || token === "null" || token === "undefined") {
    console.log("bhai token wale ke andr aa gaya hai");
    throw APIError.unauthorized(MESSAGES.UNAUTHORIZED);
  }
  console.log("kdhjdshgdhgdhsfo");
  const decoded = await verifyToken(token);

  // Permissions are embedded in the Role document — single populate is enough
  const admin = await Admin.findById(decoded.adminId || decoded.userId)
    .select("-password")
    .populate("role");

  if (!admin) {
    throw APIError.unauthorized("Admin no longer exists");
  }

  if (admin.status !== "active") {
    throw APIError.forbidden("Admin account has been blocked");
  }

  if (!admin.role) {
    throw APIError.forbidden("No role assigned to this admin");
  }

  req.admin = admin;
  req.token = token;

  next();
});

/**
 * Authorization middleware — checks section-based CRUD permissions.
 *
 * Usage:
 *   authorize("users", "read")     — admin needs isRead on "users" section
 *   authorize("users", "create")   — admin needs isCreate on "users" section
 *   authorize("users", "update")   — admin needs isUpdate on "users" section
 *   authorize("users", "delete")   — admin needs isDelete on "users" section
 *
 * super_admin role bypasses all checks.
 */
const authorize = (section, action) => {
  return (req, res, next) => {
    const admin = req.admin;

    if (!admin || !admin.role) {
      throw APIError.forbidden("Access denied — no role assigned");
    }

    // super_admin bypasses all permission checks
    if (admin.role.name === "super_admin") {
      return next();
    }

    const permissions = admin.role.permissions || [];

    // Find the permission entry for the requested section
    const perm = permissions.find((p) => p.sectionName === section);

    if (!perm) {
      throw APIError.forbidden(`No access to "${section}" section`);
    }

    // Map action string to the boolean flag
    const actionMap = {
      create: perm.isCreate,
      read: perm.isRead,
      update: perm.isUpdate,
      delete: perm.isDelete,
    };

    if (!actionMap[action]) {
      throw APIError.forbidden(
        `You don't have "${action}" permission on "${section}"`,
      );
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  authorize,
  verifyToken,
  extractToken,
};
