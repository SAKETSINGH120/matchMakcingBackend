const NotificationModel = require("../models/notification/index");

const notificationService = {
  /**
   * Notify all admins/agents about a new match created
   */
  notifyNewMatch: async (io, match) => {
    const userNames = match.users
      ? match.users.map((u) => u.name || "User").join(" & ")
      : "Two users";

    const notification = await NotificationModel.create({
      type: "new_match",
      title: "New Match Created",
      message: `A new match between ${userNames} is pending approval (Score: ${match.compatibilityScore || 0}).`,
      referenceId: match._id,
    });

    // Emit real-time notification to all admins in the "admins" room
    if (io && io.adminIo) {
      io.adminIo.to("admins").emit("admin_notification", notification);
    }

    return notification;
  },

  /**
   * Notify all admins/agents about a new meeting request
   */
  notifyMeetingRequest: async (io, match) => {
    console.log("for meeting notication hit");
    const proposerName =
      match.meeting?.proposedBy?.name ||
      match.meeting?.proposedBy?.toString() ||
      "A user";

    const notification = await NotificationModel.create({
      type: "meeting_request",
      title: "New Meeting Request",
      message: `${proposerName} has requested a meeting and it is pending approval.`,
      referenceId: match._id,
    });

    if (io && io.adminIo) {
      io.adminIo.to("admins").emit("admin_notification", notification);
    }

    return notification;
  },

  /**
   * Notify matched users in real-time when a match is created
   */
  notifyUsersMatchFound: async (io, match) => {
    if (!io || !match || !Array.isArray(match.users)) {
      return;
    }

    const payload = {
      matchId: match._id,
      type: "match_found",
      title: "It is a match!",
      message: "You have a new match.",
      compatibilityScore: match.compatibilityScore || 0,
      status: match.status || "pending",
      chatEnabled: Boolean(match.chatEnabled),
    };

    await Promise.all(
      match.users.map(async (user) => {
        if (!user || !user._id) {
          return;
        }

        await NotificationModel.create({
          type: "new_match",
          title: "It is a match!",
          message: "You have a new match.",
          referenceId: match._id,
          userId: user._id,
        });

        io.to(user._id.toString()).emit("match_notification", payload);
      }),
    );
  },
};

module.exports = notificationService;
