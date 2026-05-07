const { body, param, query } = require("express-validator");
const { withErrorHandling } = require("../../utils/requestParamsValidator");

const adminValidator = {
  getUsers: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("status")
      .optional()
      .isIn(["active", "inactive", "blocked", "deleted"])
      .withMessage("Status must be active,inactive, blocked, or deleted"),
    query("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    query("isPremium")
      .optional()
      .isIn(["true", "false"])
      .withMessage("isPremium must be true or false"),
    query("isVerified")
      .optional()
      .isIn(["true", "false"])
      .withMessage("isVerified must be true or false"),
  ]),

  // Validate userId as a route param
  userIdParam: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid user ID format"),
  ]),

  createAdminUser: withErrorHandling([
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("number")
      .trim()
      .notEmpty()
      .withMessage("Number is required")
      .isLength({ min: 8, max: 20 })
      .withMessage("Number must be between 8 and 20 characters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email must be valid"),
  ]),

  adminUserLogin: withErrorHandling([
    body("userID")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("userID cannot be empty"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ]),

  sendCredentials: withErrorHandling([
    body("userId")
      .optional()
      .isMongoId()
      .withMessage("userId must be a valid Mongo ID"),
    body("userIds")
      .optional()
      .isArray({ min: 1, max: 200 })
      .withMessage("userIds must be an array with 1 to 200 IDs"),
    body("userIds.*")
      .optional()
      .isMongoId()
      .withMessage("Each userId must be a valid Mongo ID"),
  ]),

  assignProfilesToUser: withErrorHandling([
    body("userId")
      .notEmpty()
      .withMessage("userId is required")
      .isMongoId()
      .withMessage("userId must be a valid Mongo ID"),
    body("profileIds")
      .notEmpty()
      .withMessage("profileIds is required")
      .isArray({ min: 1, max: 500 })
      .withMessage("profileIds must be an array with 1 to 500 IDs"),
    body("profileIds.*")
      .isMongoId()
      .withMessage("Each profileId must be a valid Mongo ID"),
  ]),

  getAvailableProfiles: withErrorHandling([
    param("userId").isMongoId().withMessage("userId must be a valid Mongo ID"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ]),

  // Validate update user status (block/unblock)
  updateUserStatus: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid user ID format"),
    body("action")
      .notEmpty()
      .withMessage("Action is required")
      .isIn(["block", "unblock", "deactivate", "activate"])
      .withMessage(
        "Action must be one of: block, unblock, deactivate, activate",
      ),
    body("statusReason")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("statusReason must be at most 500 characters"),
  ]),

  // Validate resolve-report body
  resolveReport: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid report ID format"),
    body("status")
      .notEmpty()
      .withMessage("Resolution status is required")
      .isIn(["resolved", "dismissed"])
      .withMessage("Status must be resolved or dismissed"),
    body("adminNote")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Admin note must be at most 500 characters"),
  ]),

  // Validate report listing query params
  getReports: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("status")
      .optional()
      .isIn(["pending", "reviewed", "resolved", "dismissed"])
      .withMessage("Invalid report status"),
  ]),

  // ── Subscription Management ──────────────────────────────

  // Validate query params for listing subscriptions
  getSubscriptions: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("status")
      .optional()
      .isIn(["active", "expired", "cancelled"])
      .withMessage("Status must be active, expired, or cancelled"),
    query("plan")
      .optional()
      .isIn(["basic", "gold", "platinum"])
      .withMessage("Plan must be basic, gold, or platinum"),
  ]),

  // Validate activate subscription body
  activateSubscription: withErrorHandling([
    param("userId").isMongoId().withMessage("Invalid user ID format"),
    body("plan")
      .notEmpty()
      .withMessage("Plan is required")
      .isIn(["basic", "gold", "platinum"])
      .withMessage("Plan must be basic, gold, or platinum"),
    body("durationDays")
      .notEmpty()
      .withMessage("Duration in days is required")
      .isInt({ min: 1, max: 365 })
      .withMessage("Duration must be between 1 and 365 days"),
  ]),

  // Validate userId param for subscription actions
  subscriptionUserParam: withErrorHandling([
    param("userId").isMongoId().withMessage("Invalid user ID format"),
  ]),

  // Validate extend subscription body
  extendSubscription: withErrorHandling([
    param("userId").isMongoId().withMessage("Invalid user ID format"),
    body("extraDays")
      .notEmpty()
      .withMessage("Extra days is required")
      .isInt({ min: 1, max: 365 })
      .withMessage("Extra days must be between 1 and 365"),
  ]),

  // ── Feedback / Support Tickets ───────────────────────────

  getTickets: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("status")
      .optional()
      .isIn(["open", "in_progress", "resolved", "closed"])
      .withMessage("Invalid ticket status"),
    query("category")
      .optional()
      .isIn([
        "bug",
        "account_issue",
        "payment",
        "safety",
        "feature_request",
        "other",
      ])
      .withMessage("Invalid ticket category"),
  ]),

  ticketIdParam: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid ticket ID format"),
  ]),

  replyToTicket: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid ticket ID format"),
    body("adminReply")
      .notEmpty()
      .withMessage("Reply message is required")
      .isString()
      .isLength({ max: 2000 })
      .withMessage("Reply must be at most 2000 characters"),
    body("status")
      .optional()
      .isIn(["in_progress", "resolved", "closed"])
      .withMessage("Status must be in_progress, resolved, or closed"),
  ]),

  updateTicketStatus: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid ticket ID format"),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["open", "in_progress", "resolved", "closed"])
      .withMessage("Invalid ticket status"),
  ]),

  // ── Match Management ─────────────────────────────────────

  matchIdParam: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid match ID format"),
  ]),

  getMatches: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("userId")
      .optional()
      .isMongoId()
      .withMessage("Invalid user ID format"),
    query("status")
      .optional()
      .isIn(["pending", "approved", "rejected", "unmatched", "blocked"])
      .withMessage("Invalid match status"),
  ]),

  // Moderate match (approve/reject) validation
  moderateMatch: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid match ID format"),
    body("action")
      .isIn(["approve", "reject"])
      .withMessage("Action must be either 'approve' or 'reject'"),
    body("adminNote")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Admin note must be at most 500 characters"),
  ]),

  // ── Meeting Management ───────────────────────────────────

  matchIdMeetingParam: withErrorHandling([
    param("matchId").isMongoId().withMessage("Invalid match ID format"),
  ]),

  getMeetings: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("meetingStatus")
      .optional()
      .isIn(["pending", "approved", "rejected", "cancelled", "completed"])
      .withMessage("Invalid meeting status"),
  ]),

  // Moderate meeting (approve/reject) validation
  moderateMeeting: withErrorHandling([
    param("matchId").isMongoId().withMessage("Invalid match ID format"),
    body("action")
      .isIn(["approve", "reject"])
      .withMessage("Action must be either 'approve' or 'reject'"),
    body("adminNote")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Admin note must be at most 500 characters"),
  ]),

  updateMeetingStatus: withErrorHandling([
    param("matchId").isMongoId().withMessage("Invalid match ID format"),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["pending", "approved", "rejected", "cancelled", "completed"])
      .withMessage("Invalid meeting status"),
  ]),

  // ── Analytics ────────────────────────────────────────────

  analyticsDays: withErrorHandling([
    query("days")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Days must be between 1 and 365"),
  ]),

  // ── Audit Logs ───────────────────────────────────────────

  getAuditLogs: withErrorHandling([
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("adminId")
      .optional()
      .isMongoId()
      .withMessage("Invalid admin ID format"),
    query("targetType")
      .optional()
      .isIn(["user", "subscription", "report", "feedback"])
      .withMessage("Invalid target type"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO 8601 date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO 8601 date"),
  ]),

  // ── Role Management ──────────────────────────────────────

  roleIdParam: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid role ID format"),
  ]),

  // Create role with inline permissions
  createRole: withErrorHandling([
    body("name")
      .notEmpty()
      .withMessage("Role name is required")
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage("Role name must be 2-50 characters"),
    body("description")
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage("Description must be at most 200 characters"),
    body("permissions")
      .optional()
      .isArray()
      .withMessage("Permissions must be an array"),
    body("permissions.*.sectionName")
      .notEmpty()
      .withMessage("Each permission must have a sectionName")
      .isString(),
    body("permissions.*.isCreate")
      .optional()
      .isBoolean()
      .withMessage("isCreate must be a boolean"),
    body("permissions.*.isRead")
      .optional()
      .isBoolean()
      .withMessage("isRead must be a boolean"),
    body("permissions.*.isUpdate")
      .optional()
      .isBoolean()
      .withMessage("isUpdate must be a boolean"),
    body("permissions.*.isDelete")
      .optional()
      .isBoolean()
      .withMessage("isDelete must be a boolean"),
  ]),

  // Update role — same validation, all fields optional
  updateRole: withErrorHandling([
    param("id").isMongoId().withMessage("Invalid role ID format"),
    body("name")
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage("Role name must be 2-50 characters"),
    body("description")
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage("Description must be at most 200 characters"),
    body("permissions")
      .optional()
      .isArray()
      .withMessage("Permissions must be an array"),
    body("permissions.*.sectionName")
      .notEmpty()
      .withMessage("Each permission must have a sectionName")
      .isString(),
    body("permissions.*.isCreate")
      .optional()
      .isBoolean()
      .withMessage("isCreate must be a boolean"),
    body("permissions.*.isRead")
      .optional()
      .isBoolean()
      .withMessage("isRead must be a boolean"),
    body("permissions.*.isUpdate")
      .optional()
      .isBoolean()
      .withMessage("isUpdate must be a boolean"),
    body("permissions.*.isDelete")
      .optional()
      .isBoolean()
      .withMessage("isDelete must be a boolean"),
  ]),
};

module.exports = { adminValidator };
