const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const adminMatchService = require("../../services/adminMatchService");
const AuditLogModel = require("../../models/auditLog/index");

const adminMatchController = {
  getMatches: async (req, res, next) => {
    try {
      const { userId, status, search } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await adminMatchService.getMatches({
        userId,
        status,
        search,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Matches retrieved successfully",
        result.matches,
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

  getMatchById: async (req, res, next) => {
    try {
      const id = req.params.id;

      const result = await adminMatchService.getMatchById(id);

      return APIResponse.send(
        res,
        true,
        200,
        "Match retrieved successfully",
        result.match,
      );
    } catch (error) {
      next(error);
    }
  },

  // Unified moderation endpoint for both approve and reject
  moderateMatch: async (req, res, next) => {
    try {
      const { action, adminNote } = req.body;
      const matchId = req.params.id;
      let match;
      let message;
      let auditAction;

      if (action === "approve") {
        match = await adminMatchService.approveMatch(
          matchId,
          req.admin._id,
          adminNote,
        );
        message = "Match approved — chat enabled";
        auditAction = "approve_match";
      } else if (action === "reject") {
        match = await adminMatchService.rejectMatch(
          matchId,
          req.admin._id,
          adminNote,
        );
        message = "Match rejected successfully";
        auditAction = "reject_match";
      }

      if (!match) {
        throw APIError.notFound("Match not found or not in pending status");
      }

      // await AuditLogModel.log({
      //   adminId: req.admin._id,
      //   action: auditAction,
      //   targetType: "match",
      //   targetId: matchId,
      //   details: { action, adminNote },
      //   ipAddress: req.ip,
      // });

      return APIResponse.send(res, true, 200, message, match);
    } catch (error) {
      next(error);
    }
  },

  unmatchUsers: async (req, res, next) => {
    try {
      const result = await adminMatchService.unmatchUsers(req.params.id);

      if (!result) {
        throw APIError.notFound("Match not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "unmatch_users",
        targetType: "user",
        targetId: req.params.id,
        details: { userA: result.userA, userB: result.userB },
        ipAddress: req.ip,
      });

      return APIResponse.send(res, true, 200, "Users unmatched successfully", {
        userA: result.userA,
        userB: result.userB,
      });
    } catch (error) {
      next(error);
    }
  },

  // ── Meeting Management ───────────────────────────────────

  getMeetings: async (req, res, next) => {
    try {
      const { meetingStatus } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await adminMatchService.getMeetings({
        meetingStatus,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Meeting requests retrieved successfully",
        result.matches,
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

  approveMeeting: async (req, res, next) => {
    try {
      const { adminNote } = req.body;
      const match = await adminMatchService.approveMeeting(
        req.params.matchId,
        req.admin._id,
        adminNote,
      );

      if (!match) {
        throw APIError.notFound("Meeting not found or not in pending status");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "approve_meeting",
        targetType: "match",
        targetId: req.params.matchId,
        details: { adminNote },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Meeting approved successfully",
        match,
      );
    } catch (error) {
      next(error);
    }
  },

  rejectMeeting: async (req, res, next) => {
    try {
      const { adminNote } = req.body;
      const match = await adminMatchService.rejectMeeting(
        req.params.matchId,
        req.admin._id,
        adminNote,
      );

      if (!match) {
        throw APIError.notFound("Meeting not found or not in pending status");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "reject_meeting",
        targetType: "match",
        targetId: req.params.matchId,
        details: { adminNote },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Meeting rejected successfully",
        match,
      );
    } catch (error) {
      next(error);
    }
  },

  updateMeetingStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      const match = await adminMatchService.updateMeetingStatus(
        req.params.matchId,
        status,
        req.admin._id,
      );

      if (!match) {
        throw APIError.notFound("Meeting not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "update_meeting_status",
        targetType: "match",
        targetId: req.params.matchId,
        details: { status },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        `Meeting status updated to ${status}`,
        match,
      );
    } catch (error) {
      next(error);
    }
  },

  getMatchStats: async (req, res, next) => {
    try {
      const stats = await adminMatchService.getMatchStats();

      return APIResponse.send(
        res,
        true,
        200,
        "Match stats retrieved successfully",
        stats,
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminMatchController;
