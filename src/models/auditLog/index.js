const AuditLog = require("./AuditLog");

module.exports = {
  /**
   * Record an admin action.
   * Call this after any admin mutation (block, cancel, resolve, etc.)
   */
  log: async ({
    adminId,
    action,
    targetType,
    targetId,
    details,
    ipAddress,
  }) => {
    return AuditLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
    });
  },

  /**
   * Get paginated audit logs with optional filters.
   * Supports: adminId, action, targetType, date range
   */
  getLogs: async ({
    adminId,
    action,
    targetType,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  }) => {
    const filter = {};

    if (adminId) filter.adminId = adminId;
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("adminId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return { logs, total, page, limit };
  },
};
