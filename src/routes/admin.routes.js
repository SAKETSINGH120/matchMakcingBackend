const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/admin");
const adminUserController = require("../controllers/admin/adminUserController");
const adminSubscriptionController = require("../controllers/admin/adminSubscriptionController");
const adminDashboardController = require("../controllers/admin/adminDashboardController");
const adminFeedbackController = require("../controllers/admin/adminFeedbackController");
const adminAnalyticsController = require("../controllers/admin/adminAnalyticsController");
const adminMatchController = require("../controllers/admin/adminMatchController");
const adminAuditLogController = require("../controllers/admin/adminAuditLogController");
const adminRoleController = require("../controllers/admin/adminRoleController");
const adminCMSController = require("../controllers/admin/adminCMSController");
const adminEmailTemplateController = require("../controllers/admin/adminEmailTemplateController");
const adminNotificationController = require("../controllers/admin/adminNotificationController");
const adminChatController = require("../controllers/admin/adminChatController");
const feedController = require("../controllers/feed/feed");
const { adminValidator } = require("../controllers/admin/validator");
const cmsValidator = require("../controllers/cms/validator");
const emailTemplateValidator = require("../controllers/admin/emailTemplateValidator");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateAdmin, authorize } = require("../middlewares/auth");
const { userValidator } = require("../controllers/user/validator");

router.post("/signup", asyncHandler(adminController.signup));
router.post("/login", asyncHandler(adminController.login));

// ── All routes below require admin authentication
router.use(authenticateAdmin);

//profile
router.get("/profile", asyncHandler(adminController.profile));

// ── Dashboard
router.get(
  "/dashboard",
  authorize("dashboard", "read"),
  asyncHandler(adminDashboardController.getStats),
);

// ── Analytics & Trends
router.get(
  "/analytics/user-growth",
  authorize("analytics", "read"),
  adminValidator.analyticsDays,
  asyncHandler(adminAnalyticsController.getUserGrowth),
);
router.get(
  "/analytics/demographics",
  authorize("analytics", "read"),
  asyncHandler(adminAnalyticsController.getDemographics),
);
router.get(
  "/analytics/engagement",
  authorize("analytics", "read"),
  adminValidator.analyticsDays,
  asyncHandler(adminAnalyticsController.getEngagementTrends),
);
router.get(
  "/analytics/subscriptions",
  authorize("analytics", "read"),
  adminValidator.analyticsDays,
  asyncHandler(adminAnalyticsController.getSubscriptionTrends),
);

// ── User Management
router.get(
  "/users",
  authorize("users", "read"),
  adminValidator.getUsers,
  asyncHandler(adminUserController.getUsers),
);
router.get(
  "/users/:id",
  authorize("users", "read"),
  adminValidator.userIdParam,
  asyncHandler(adminUserController.getUserById),
);
router.patch(
  "/users/:id/status",
  authorize("users", "update"),
  adminValidator.updateUserStatus,
  asyncHandler(adminUserController.updateUserStatus),
);
router.patch(
  "/users/:id/deactivate",
  authorize("users", "delete"),
  adminValidator.userIdParam,
  asyncHandler(adminUserController.deactivateUser),
);

// ── Reports
router.get(
  "/reports",
  authorize("reports", "read"),
  adminValidator.getReports,
  asyncHandler(adminUserController.getReports),
);
router.patch(
  "/reports/:id/resolve",
  authorize("reports", "update"),
  adminValidator.resolveReport,
  asyncHandler(adminUserController.resolveReport),
);

// ── Match Management
router.get(
  "/matches",
  authorize("match", "read"),
  adminValidator.getMatches,
  asyncHandler(adminMatchController.getMatches),
);
router.get(
  "/matches/:id",
  authorize("match", "read"),
  asyncHandler(adminMatchController.getMatchById),
);
router.get(
  "/matches/stats",
  authorize("matches", "read"),
  asyncHandler(adminMatchController.getMatchStats),
);
router.patch(
  "/matches/:id/updateStatus",
  authorize("matches", "update"),
  adminValidator.moderateMatch,
  asyncHandler(adminMatchController.moderateMatch),
);
router.delete(
  "/matches/:id",
  authorize("matches", "delete"),
  adminValidator.matchIdParam,
  asyncHandler(adminMatchController.unmatchUsers),
);

// ── Meeting Management
router.get(
  "/meetings",
  authorize("meeting", "read"),
  adminValidator.getMeetings,
  asyncHandler(adminMatchController.getMeetings),
);
router.patch(
  "/meetings/:matchId/moderate",
  authorize("meeting", "update"),
  adminValidator.moderateMeeting,
  asyncHandler(adminMatchController.moderateMeeting),
);
router.patch(
  "/meetings/:matchId/status",
  authorize("meeting", "update"),
  adminValidator.updateMeetingStatus,
  asyncHandler(adminMatchController.updateMeetingStatus),
);

// ── Subscription Management
router.get(
  "/subscriptions",
  authorize("subscriptions", "read"),
  adminValidator.getSubscriptions,
  asyncHandler(adminSubscriptionController.getSubscriptions),
);
router.get(
  "/subscriptions/premium-users",
  authorize("subscriptions", "read"),
  asyncHandler(adminSubscriptionController.getPremiumUsers),
);
router.get(
  "/subscriptions/revenue",
  authorize("subscriptions", "read"),
  asyncHandler(adminSubscriptionController.getRevenueOverview),
);
router.post(
  "/subscriptions/:userId/activate",
  authorize("subscriptions", "create"),
  adminValidator.activateSubscription,
  asyncHandler(adminSubscriptionController.activateSubscription),
);
router.patch(
  "/subscriptions/:userId/deactivate",
  authorize("subscriptions", "update"),
  adminValidator.subscriptionUserParam,
  asyncHandler(adminSubscriptionController.deactivateSubscription),
);
router.post(
  "/subscriptions/:userId/cancel",
  authorize("subscriptions", "delete"),
  adminValidator.subscriptionUserParam,
  asyncHandler(adminSubscriptionController.cancelSubscription),
);
router.patch(
  "/subscriptions/:userId/extend",
  authorize("subscriptions", "update"),
  adminValidator.extendSubscription,
  asyncHandler(adminSubscriptionController.extendSubscription),
);

// ── Feedback / Support Tickets
router.get(
  "/feedback",
  authorize("feedback", "read"),
  adminValidator.getTickets,
  asyncHandler(adminFeedbackController.getTickets),
);
router.get(
  "/feedback/stats",
  authorize("feedback", "read"),
  asyncHandler(adminFeedbackController.getStats),
);
router.get(
  "/feedback/ratings",
  authorize("feedback", "read"),
  asyncHandler(adminFeedbackController.getRatings),
);
router.get(
  "/feedback/:id",
  authorize("feedback", "read"),
  adminValidator.ticketIdParam,
  asyncHandler(adminFeedbackController.getTicketById),
);
router.post(
  "/feedback/:id/reply",
  authorize("feedback", "create"),
  adminValidator.replyToTicket,
  asyncHandler(adminFeedbackController.replyToTicket),
);
router.patch(
  "/feedback/:id/status",
  authorize("feedback", "update"),
  adminValidator.updateTicketStatus,
  asyncHandler(adminFeedbackController.updateTicketStatus),
);

// ── Audit Logs ─────────────────────────────────────────────
router.get(
  "/audit-logs",
  authorize("audit_logs", "read"),
  adminValidator.getAuditLogs,
  asyncHandler(adminAuditLogController.getLogs),
);

// ═══════════════════════════════════════════════════════════
// Role Management (super_admin only)
// Permissions are passed inline when creating/updating a role.
// ═══════════════════════════════════════════════════════════
router.get(
  "/roles",
  authorize("roles", "read"),
  asyncHandler(adminRoleController.getAll),
);
router.get(
  "/roles/:id",
  authorize("roles", "read"),
  adminValidator.roleIdParam,
  asyncHandler(adminRoleController.getById),
);
router.post(
  "/roles",
  authorize("roles", "create"),
  adminValidator.createRole,
  asyncHandler(adminRoleController.create),
);
router.put(
  "/roles/:id",
  authorize("roles", "update"),
  adminValidator.updateRole,
  asyncHandler(adminRoleController.update),
);
router.delete(
  "/roles/:id",
  authorize("roles", "delete"),
  adminValidator.roleIdParam,
  asyncHandler(adminRoleController.delete),
);

// ── CMS Management
router.get(
  "/cms",
  authorize("cms", "read"),
  asyncHandler(adminCMSController.getAll),
);
router.get(
  "/cms/:pageType",
  authorize("cms", "read"),
  cmsValidator.pageTypeParam,
  asyncHandler(adminCMSController.getOne),
);
router.post(
  "/cms",
  authorize("cms", "create"),
  cmsValidator.createOrUpdate,
  asyncHandler(adminCMSController.createOrUpdate),
);
router.patch(
  "/cms/:pageType/toggle",
  authorize("cms", "update"),
  cmsValidator.pageTypeParam,
  asyncHandler(adminCMSController.toggleStatus),
);

// ── Email Templates
router.get(
  "/email-template",
  asyncHandler(adminEmailTemplateController.getCurrent),
);
router.post(
  "/email-template",
  emailTemplateValidator.upsert,
  asyncHandler(adminEmailTemplateController.createOrUpdate),
);
router.post(
  "/email-template/preview",
  emailTemplateValidator.preview,
  asyncHandler(adminEmailTemplateController.preview),
);

// ── Chat History
router.get(
  "/chat/:matchId",
  authorize("matches", "read"),
  adminValidator.matchIdMeetingParam,
  asyncHandler(adminChatController.getChatHistory),
);

// ── Notifications
router.get(
  "/notifications",
  asyncHandler(adminNotificationController.getNotifications),
);
router.get(
  "/notifications/unread-count",
  asyncHandler(adminNotificationController.getUnreadCount),
);
router.patch(
  "/notifications/:id/read",
  asyncHandler(adminNotificationController.markAsRead),
);
router.patch(
  "/notifications/read-all",
  asyncHandler(adminNotificationController.markAllAsRead),
);

//create user
router.post(
  "/user/create",
  // authorize("users", "create"),
  adminValidator.createAdminUser,
  asyncHandler(adminUserController.createUserViaAdmin),
);

router.post(
  "/user/send-credentials",
  // authorize("users", "update"),
  adminValidator.sendCredentials,
  asyncHandler(adminUserController.sendCredentialsToUsersEmail),
);

//admin assign the profile to generate the user feed
router.get(
  "/user/:userId/available-profiles",
  authorize("users", "read"),
  adminValidator.getAvailableProfiles,
  asyncHandler(adminUserController.getAvailableProfilesForAssignment),
);

router.post(
  "/user/profile-assign",
  authorize("users", "update"),
  adminValidator.assignProfilesToUser,
  asyncHandler(adminUserController.assignProfilesToUser),
);

router.post(
  "/feed/clear",
  authorize("users", "delete"),
  asyncHandler(feedController.clearFeed),
);
router.post(
  "/user/profile-remove",
  asyncHandler(feedController.removeProfileFromUserFeed),
);

router.put(
  "/user-profile-update/:profileId",
  authenticateAdmin,
  userValidator.updateUser,
  adminUserController.updateUser,
);
module.exports = router;
