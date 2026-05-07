const APIResponse = require("../../utils/APIResponse");
const AuditLogModel = require("../../models/auditLog/index");

const adminAuditLogController = {

  getLogs: async (req, res, next) => {
    try {
      const { adminId, action, targetType, startDate, endDate } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await AuditLogModel.getLogs({
        adminId,
        action,
        targetType,
        startDate,
        endDate,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Audit logs retrieved successfully",
        result.logs,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminAuditLogController;
