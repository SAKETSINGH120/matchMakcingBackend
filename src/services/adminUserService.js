const User = require("../models/user/User");

/**
 * Admin User Service
 * All user-management queries used by admin controllers.
 */
const adminUserService = {
  /**
   * Get paginated users with optional search and filters.
   * Supports: search (name/number), status, gender, isPremium, isVerified
   */
  getUsers: async ({
    search,
    status,
    gender,
    isPremium,
    isVerified,
    page = 1,
    limit = 10,
  }) => {
    const filter = {};

    // Text search across name and phone number
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { number: { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (isPremium !== undefined) filter.isPremium = isPremium === "true";
    if (isVerified !== undefined) filter.isVerified = isVerified === "true";

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-otp -__v")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return { users, total, page, limit };
  },

  /**
   * Update user status — sets status to specified value (blocked, active, etc.).
   */
  updateUserStatus: async (userId, status, statusReason) => {
    const update = { status };
    if (typeof statusReason !== "undefined") update.statusReason = statusReason;

    return User.findByIdAndUpdate(userId, update, { new: true })
      .select("-otp -__v")
      .lean();
  },

  /**
   * Soft-delete (deactivate) a user — sets status to "deleted".
   * Does NOT remove the document from the database.
   */
  deactivateUser: async (userId) => {
    return User.findByIdAndUpdate(userId, { status: "deleted" }, { new: true })
      .select("-otp -__v")
      .lean();
  },

  /**
   * Get a single user by ID (admin view — no sensitive fields).
   */
  getUserById: async (userId) => {
    return User.findById(userId).select("-otp -__v").lean();
  },
};

module.exports = adminUserService;
