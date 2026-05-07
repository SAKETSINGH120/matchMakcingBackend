const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const NotificationModel = require("../../models/notification/index");

const notificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const { type, isRead } = req.query;

      const filters = { page, limit };
      if (type) filters.type = type;
      if (isRead !== undefined) filters.isRead = isRead === "true";

      const result = await NotificationModel.getAllForUser(
        req.user._id,
        filters,
      );

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
      const count = await NotificationModel.getUnreadCountForUser(req.user._id);

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
      const notification = await NotificationModel.markAsReadForUser(
        id,
        req.user._id,
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
      await NotificationModel.markAllAsReadForUser(req.user._id);

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

module.exports = notificationController;
