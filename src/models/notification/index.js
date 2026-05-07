const Notification = require("./Notification");

module.exports = {
  create: async ({ type, title, message, referenceId, userId = null }) => {
    return Notification.create({ type, title, message, referenceId, userId });
  },

  getAll: async ({ page = 1, limit = 20, type, isRead } = {}) => {
    const filter = { userId: null };
    if (type) filter.type = type;
    if (typeof isRead === "boolean") filter.isRead = isRead;

    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return { notifications, total, page, limit };
  },

  markAsRead: async (notificationId, adminId) => {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId: null },
      { isRead: true, $addToSet: { readBy: adminId } },
      { new: true },
    ).lean();
  },

  markAllAsRead: async (adminId) => {
    return Notification.updateMany(
      { isRead: false, userId: null },
      { isRead: true, $addToSet: { readBy: adminId } },
    );
  },

  getUnreadCount: async () => {
    return Notification.countDocuments({ isRead: false, userId: null });
  },

  getAllForUser: async (
    userId,
    { page = 1, limit = 20, type, isRead } = {},
  ) => {
    const filter = { userId };
    if (type) filter.type = type;
    if (typeof isRead === "boolean") filter.isRead = isRead;

    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return { notifications, total, page, limit };
  },

  markAsReadForUser: async (notificationId, userId) => {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true },
    ).lean();
  },

  markAllAsReadForUser: async (userId) => {
    return Notification.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );
  },

  getUnreadCountForUser: async (userId) => {
    return Notification.countDocuments({ userId, isRead: false });
  },
};
