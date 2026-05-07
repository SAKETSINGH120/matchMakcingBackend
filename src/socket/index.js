const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwtUtils");
const User = require("../models/user/User");
const Admin = require("../models/admin/admin");
const MatchModel = require("../models/match/index");
const MessageModel = require("../models/message/index");

const initSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  app.set("io", io);

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers["authorization"];

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const cleanToken = token.startsWith("Bearer ")
        ? token.substring(7)
        : token;
      const decoded = verifyToken(cleanToken);
      const user = await User.findById(decoded.userId).select(
        "_id name status",
      );

      if (!user || user.status !== "active") {
        return next(new Error("User not found or inactive"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${userId}`);

    socket.join(userId);

    socket.on("join_chat", async (matchId, callback) => {
      console.log("joined");
      try {
        const match = await MatchModel.getMatchById(matchId);

        if (!match) {
          return callback?.({ success: false, error: "Match not found" });
        }

        const isParticipant = match.users.some(
          (u) => u._id.toString() === userId,
        );
        if (!isParticipant) {
          return callback?.({ success: false, error: "Not a participant" });
        }

        if (!match.chatEnabled) {
          return callback?.({ success: false, error: "Chat not enabled" });
        }

        socket.join(matchId);
        callback?.({ success: true });
      } catch (error) {
        console.error("join_chat error:", error.message);
        callback?.({ success: false, error: "Server error" });
      }
    });

    socket.on("send_message", async (data, callback) => {
      try {
        const { matchId, text, messageType } = data;

        if (!matchId || !text || !text.trim()) {
          console.log("inside if");
          return callback?.({
            success: false,
            error: "matchId and text required",
          });
        }

        if (text.length > 2000) {
          return callback?.({
            success: false,
            error: "Message too long (max 2000)",
          });
        }

        const match = await MatchModel.getMatchById(matchId);

        if (!match) {
          return callback?.({ success: false, error: "Match not found" });
        }

        const isParticipant = match.users.some(
          (u) => u._id.toString() === userId,
        );
        if (!isParticipant) {
          return callback?.({ success: false, error: "Not a participant" });
        }

        if (!match.chatEnabled) {
          return callback?.({ success: false, error: "Chat not enabled" });
        }

        const message = await MessageModel.createMessage({
          matchId,
          sender: socket.user._id,
          text: text.trim(),
          messageType: messageType || "text",
        });

        const populatedMessage = {
          ...message,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
          },
        };

        io.to(matchId).emit("new_message", populatedMessage);

        const otherUser = match.users.find((u) => u._id.toString() !== userId);
        if (otherUser) {
          io.to(otherUser._id.toString()).emit("message_notification", {
            matchId,
            message: populatedMessage,
          });
        }

        callback?.({ success: true, message: populatedMessage });
      } catch (error) {
        console.error("send_message error:", error.message);
        callback?.({ success: false, error: "Failed to send message" });
      }
    });

    socket.on("typing", (matchId) => {
      socket.to(matchId).emit("user_typing", {
        matchId,
        userId,
      });
    });

    socket.on("stop_typing", (matchId) => {
      socket.to(matchId).emit("user_stop_typing", {
        matchId,
        userId,
      });
    });

    socket.on("leave_chat", (matchId) => {
      socket.leave(matchId);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${userId}`);
    });
  });

  // ── Admin namespace for real-time notifications ────────────
  const adminIo = io.of("/admin");

  adminIo.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers["authorization"];

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const cleanToken = token.startsWith("Bearer ")
        ? token.substring(7)
        : token;
      const decoded = verifyToken(cleanToken);

      const admin = await Admin.findById(decoded.adminId || decoded.userId)
        .select("_id name status role")
        .populate("role");

      if (!admin || admin.status !== "active") {
        return next(new Error("Admin not found or inactive"));
      }

      socket.admin = admin;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  adminIo.on("connection", (socket) => {
    const adminId = socket.admin._id.toString();
    console.log(`Admin socket connected: ${adminId}`);

    // Join the shared "admins" room for broadcast notifications
    socket.join("admins");

    socket.on("disconnect", () => {
      console.log(`Admin socket disconnected: ${adminId}`);
    });
  });

  // Expose the admin namespace on the main io so the service can emit
  io.adminIo = adminIo;

  return io;
};

module.exports = initSocket;
