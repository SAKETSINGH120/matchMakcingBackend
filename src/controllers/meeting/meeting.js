const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const MatchModel = require("../../models/match/index");
const notificationService = require("../../services/notificationService");

const meetingController = {
  getMyMeetings: async (req, res, next) => {
    const userId = req.user._id;

    try {
      const matches = await MatchModel.getMatchesWithMeetings(userId);

      const meetings = matches.map((match) => {
        const isProposer =
          match.meeting.proposedBy?._id?.toString() === userId.toString() ||
          match.meeting.proposedBy?.toString() === userId.toString();

        const otherUser = match.users.find(
          (u) => u._id.toString() !== userId.toString(),
        );

        console.log("🚀 ~ match.meeting.status:", match.meeting.status);
        if (match.meeting.status !== "approved" && !isProposer) {
          return {
            matchId: match._id,
            // otherUser,
            meeting: {
              proposedBy: match.meeting.proposedBy,
              dateTime: match.meeting.dateTime,
              notes: match.meeting.notes,
              status: match.meeting.status,
            },
          };
        }

        return {
          matchId: match._id,
          // otherUser,
          meeting: match.meeting,
        };
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Meetings retrieved successfully",
        meetings,
      );
    } catch (error) {
      next(error);
    }
  },

  requestMeeting: async (req, res, next) => {
    console.log("req.user", req.user);
    const userId = "699ec6fe6e7cd35669eac1de"; //req.user._id;

    const { matchId, location, dateTime, notes } = req.body;

    try {
      if (new Date(dateTime) <= new Date()) {
        throw APIError.badRequest("Meeting date must be in the future");
      }

      const match = await MatchModel.requestMeeting(matchId, userId, {
        location,
        dateTime,
        notes,
      });

      if (!match) {
        throw APIError.badRequest(
          "Match not found, not approved, or a meeting already exists",
        );
      }

      // Notify admins/agents about the meeting request
      const io = req.app.get("io");
      notificationService.notifyMeetingRequest(io, match);

      return APIResponse.send(
        res,
        true,
        201,
        "Meeting request submitted. Waiting for admin approval.",
        {
          matchId: match._id,
          meeting: match.meeting,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  getMeeting: async (req, res, next) => {
    const userId = req.user._id;
    const { matchId } = req.params;

    try {
      const match = await MatchModel.getMatchById(matchId);

      if (!match) {
        throw APIError.notFound("Match not found");
      }

      // Verify user is part of this match
      const isParticipant = match.users.some(
        (u) => u._id.toString() === userId.toString(),
      );
      if (!isParticipant) {
        throw APIError.forbidden("You are not part of this match");
      }

      if (!match.meeting || !match.meeting.status) {
        throw APIError.notFound("No meeting request found for this match");
      }

      const isProposer =
        match.meeting.proposedBy?._id?.toString() === userId.toString() ||
        match.meeting.proposedBy?.toString() === userId.toString();

      if (match.meeting.status !== "approved" && !isProposer) {
        return APIResponse.send(
          res,
          true,
          200,
          "A meeting has been proposed and is awaiting admin approval",
          {
            matchId: match._id,
            meeting: {
              proposedBy: match.meeting.proposedBy,
              dateTime: match.meeting.dateTime,
              notes: match.meeting.notes,
              status: match.meeting.status,
            },
          },
        );
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Meeting retrieved successfully",
        {
          matchId: match._id,
          meeting: match.meeting,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  cancelMeeting: async (req, res, next) => {
    const userId = req.user._id;
    const { matchId } = req.params;

    try {
      const match = await MatchModel.cancelMeeting(matchId, userId);

      if (!match) {
        throw APIError.notFound(
          "Meeting not found or you are not authorized to cancel it",
        );
      }

      return APIResponse.send(res, true, 200, "Meeting cancelled successfully");
    } catch (error) {
      next(error);
    }
  },
};

module.exports = meetingController;
