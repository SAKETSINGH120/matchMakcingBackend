const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const NotificationModel = require("../../models/notification/index");

const adminNotificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const { type, isRead } = req.query;

      const filters = { page, limit };
      if (type) filters.type = type;
      if (isRead !== undefined) filters.isRead = isRead === "true";

      const result = await NotificationModel.getAll(filters);

      return APIResponse.send(
        res,
        true,
        200,
        "Notifications retrieved successfully",
        result.notifications,
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

  getUnreadCount: async (req, res, next) => {
    try {
      const count = await NotificationModel.getUnreadCount();

      return APIResponse.send(
        res,
        true,
        200,
        "Unread count retrieved successfully",
        { unreadCount: count },
      );
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const { id } = req.params;
      const notification = await NotificationModel.markAsRead(
        id,
        req.admin._id,
      );

      if (!notification) {
        throw APIError.notFound("Notification not found");
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Notification marked as read",
        notification,
      );
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      await NotificationModel.markAllAsRead(req.admin._id);

      return APIResponse.send(
        res,
        true,
        200,
        "All notifications marked as read",
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminNotificationController;
