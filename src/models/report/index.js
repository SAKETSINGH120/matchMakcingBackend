const Report = require("./Report");

module.exports = {
  /**
   * Create a new report from one user against another.
   */
  createReport: async ({ reportedBy, reportedUser, reason, description }) => {
    return Report.create({ reportedBy, reportedUser, reason, description });
  },

  /**
   * Get paginated reports with optional status filter.
   */
  getReports: async ({ status, page = 1, limit = 10 }) => {
    const filter = {};
    if (status) filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("reportedBy", "name number")
        .populate("reportedUser", "name number primaryImage status")
        .populate("resolvedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    return { reports, total, page, limit };
  },

  /**
   * Resolve a report — mark it as resolved or dismissed with admin notes.
   */
  resolveReport: async (reportId, { status, adminNote, resolvedBy }) => {
    return Report.findByIdAndUpdate(
      reportId,
      {
        status,
        adminNote,
        resolvedBy,
        resolvedAt: new Date(),
      },
      { new: true },
    )
      .populate("reportedBy", "name number")
      .populate("reportedUser", "name number")
      .lean();
  },

  /**
   * Count reports grouped by status (for dashboard).
   */
  getReportCounts: async () => {
    const counts = await Report.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Convert to a clean object: { pending: 5, resolved: 12, ... }
    return counts.reduce(
      (acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      },
      { pending: 0, reviewed: 0, resolved: 0, dismissed: 0 },
    );
  },
};
