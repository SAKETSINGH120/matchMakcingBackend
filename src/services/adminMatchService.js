const Match = require("../models/match/Match");
const MatchModel = require("../models/match/index");
const User = require("../models/user/User");
const Swipe = require("../models/swipe/Swipe");

/**
 * Admin Match Service
 * View and manage matches + meetings from the admin panel.
 */
const adminMatchService = {
  /**
   * Get paginated matches with optional userId and status filter.
   */
  getMatches: async ({ userId, status, search, page = 1, limit = 10 }) => {
    const filter = {};
    if (userId) filter.users = userId;
    if (status) filter.status = status;

    // If search is provided, find matching user IDs first
    if (search) {
      const regex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      const matchingUsers = await User.find({
        $or: [{ name: regex }, { number: regex }],
      })
        .select("_id")
        .lean();

      const matchingUserIds = matchingUsers.map((u) => u._id);
      filter.users = filter.users
        ? {
            $in: [filter.users].filter((id) =>
              matchingUserIds.some((mid) => mid.equals(id)),
            ),
          }
        : { $in: matchingUserIds };
    }

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .populate("users")
        // .populate("moderatedBy", "name email")
        .sort({ matchedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Match.countDocuments(filter),
    ]);

    return { matches, total, page, limit };
  },

  getMatchById: async (matchId) => {
    const match = await Match.findOne({ _id: matchId })
      .populate(
        "users",
        "name number primaryImage secondaryImages gender status isPremium location",
      )
      .populate("moderatedBy", "name email");
    return { match };
  },

  /**
   * Approve a pending match — enables chat.
   */
  approveMatch: async (matchId, adminId, adminNote) => {
    return MatchModel.approveMatch(matchId, adminId, adminNote);
  },

  /**
   * Reject a pending match.
   */
  rejectMatch: async (matchId, adminId, adminNote) => {
    return MatchModel.rejectMatch(matchId, adminId, adminNote);
  },

  /**
   * Unmatch two users — removes match and clears swipe records.
   */
  unmatchUsers: async (matchId) => {
    const match = await Match.findById(matchId);
    if (!match) return null;

    const [userA, userB] = match.users;

    await Swipe.deleteMany({
      $or: [
        { fromUser: userA, toUser: userB },
        { fromUser: userB, toUser: userA },
      ],
    });

    await Match.findByIdAndDelete(matchId);
    return { userA, userB };
  },

  // ── Meeting Management ───────────────────────────────────

  /**
   * Get matches that have meeting requests with optional status filter.
   */
  getMeetings: async ({ meetingStatus, page = 1, limit = 10 }) => {
    const filter = { "meeting.status": { $exists: true } };
    if (meetingStatus) filter["meeting.status"] = meetingStatus;

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .select("users meeting")
        .populate("users", "name number primaryImage gender")
        .populate("meeting.proposedBy", "name primaryImage")
        .sort({ "meeting.dateTime": -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Match.countDocuments(filter),
    ]);

    return { matches, total, page, limit };
  },

  /**
   * Approve a meeting request.
   */
  approveMeeting: async (matchId, adminId, adminNote) => {
    return MatchModel.approveMeeting(matchId, adminId, adminNote);
  },

  /**
   * Reject a meeting request.
   */
  rejectMeeting: async (matchId, adminId, adminNote) => {
    return MatchModel.rejectMeeting(matchId, adminId, adminNote);
  },

  /**
   * Update meeting status (completed, cancelled, etc.).
   */
  updateMeetingStatus: async (matchId, status, adminId) => {
    return MatchModel.updateMeetingStatus(matchId, status, adminId);
  },

  // ── Stats ────────────────────────────────────────────────

  /**
   * Match + meeting stats.
   */
  getMatchStats: async () => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      pending,
      approved,
      rejected,
      today,
      thisWeek,
      thisMonth,
      meetingsPending,
      meetingsApproved,
    ] = await Promise.all([
      Match.countDocuments(),
      Match.countDocuments({ status: "pending" }),
      Match.countDocuments({ status: "approved" }),
      Match.countDocuments({ status: "rejected" }),
      Match.countDocuments({ matchedAt: { $gte: startOfToday } }),
      Match.countDocuments({ matchedAt: { $gte: startOfWeek } }),
      Match.countDocuments({ matchedAt: { $gte: startOfMonth } }),
      Match.countDocuments({ "meeting.status": "pending" }),
      Match.countDocuments({ "meeting.status": "approved" }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      today,
      thisWeek,
      thisMonth,
      meetings: { pending: meetingsPending, approved: meetingsApproved },
    };
  },
};

module.exports = adminMatchService;
