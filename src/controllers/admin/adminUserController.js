const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const adminUserService = require("../../services/adminUserService");
const feedService = require("../../services/feedService");
const ReportModel = require("../../models/report/index");
const AuditLogModel = require("../../models/auditLog/index");
const User = require("../../models/user/index");
const { generateToken } = require("../../utils/jwtUtils");
const { sendUserCredentialsEmail } = require("../../utils/credentialMailer");
const fileUploader = require("../../utils/fileUploader");

const adminUserController = {
  getUsers: async (req, res, next) => {
    try {
      const { search, status, gender, isPremium, isVerified } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await adminUserService.getUsers({
        search,
        status,
        gender,
        isPremium,
        isVerified,
        page,
        limit,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Users retrieved successfully",
        result.users,
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

  getUserById: async (req, res, next) => {
    try {
      const user = await adminUserService.getUserById(req.params.id);
      console.log("🚀 ~ user:", user);

      if (!user) {
        throw APIError.notFound("User not found");
      }

      return APIResponse.send(
        res,
        true,
        200,
        "User retrieved successfully",
        user,
      );
    } catch (error) {
      next(error);
    }
  },

  updateUserStatus: async (req, res, next) => {
    try {
      const { action, statusReason } = req.body;
      const userId = req.params.id;

      let user;
      let message;
      let auditAction;

      if (action === "block") {
        user = await adminUserService.updateUserStatus(
          userId,
          "blocked",
          statusReason,
        );
        message = "User blocked successfully";
        auditAction = "block_user";
      } else if (action === "unblock") {
        user = await adminUserService.updateUserStatus(
          userId,
          "active",
          statusReason,
        );
        message = "User unblocked successfully";
        auditAction = "unblock_user";
      } else if (action === "deactivate") {
        user = await adminUserService.updateUserStatus(
          userId,
          "inactive",
          statusReason,
        );
        message = "User marked inactive successfully";
        auditAction = "deactivate_user";
      } else if (action === "activate") {
        user = await adminUserService.updateUserStatus(
          userId,
          "active",
          statusReason,
        );
        message = "User activated successfully";
        auditAction = "activate_user";
      }

      if (!user) {
        throw APIError.notFound("User not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: auditAction,
        targetType: "user",
        targetId: userId,
        details: { action, statusReason },
        ipAddress: req.ip,
      });

      return APIResponse.send(res, true, 200, message, {
        id: user._id,
        name: user.name,
        status: user.status,
        statusReason: user.statusReason || "",
      });
    } catch (error) {
      next(error);
    }
  },

  deactivateUser: async (req, res, next) => {
    try {
      const user = await adminUserService.deactivateUser(req.params.id);

      if (!user) {
        throw APIError.notFound("User not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "deactivate_user",
        targetType: "user",
        targetId: req.params.id,
        ipAddress: req.ip,
      });

      return APIResponse.send(res, true, 200, "User deactivated successfully", {
        id: user._id,
        name: user.name,
        status: user.status,
      });
    } catch (error) {
      next(error);
    }
  },

  getReports: async (req, res, next) => {
    try {
      const { status } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await ReportModel.getReports({ status, page, limit });

      return APIResponse.send(
        res,
        true,
        200,
        "Reports retrieved successfully",
        result.reports,
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

  resolveReport: async (req, res, next) => {
    try {
      const { status, adminNote } = req.body;

      const report = await ReportModel.resolveReport(req.params.id, {
        status,
        adminNote,
        resolvedBy: req.admin._id,
      });

      if (!report) {
        throw APIError.notFound("Report not found");
      }

      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "resolve_report",
        targetType: "report",
        targetId: req.params.id,
        details: { resolution: status },
        ipAddress: req.ip,
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Report resolved successfully",
        report,
      );
    } catch (error) {
      next(error);
    }
  },

  createUserViaAdmin: async (req, res, next) => {
    try {
      const { number, name, email, gender } = req.body;

      if (!number || !name || !email || !gender) {
        throw APIError.badRequest(
          "Number , email , gender and name are required",
        );
      }

      const alreadyPresent = await User.getUserbyNumber(number);
      if (alreadyPresent) {
        throw APIError.conflict("User already exists with this number");
      }

      const { user, temporaryPassword } =
        await User.createUserVaiAdminWithUserIdAndPassword({
          number,
          name,
          email,
          gender,
        });

      const userData = {
        id: user._id,
        name: user.name,
        number: user.number,
        userID: user.userID,
        temporaryPassword,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        gender,
      };

      return APIResponse.send(
        res,
        true,
        201,
        "User profile created successfully",
        userData,
      );
    } catch (error) {
      next(error);
    }
  },

  sendCredentialsToUsersEmail: async (req, res, next) => {
    try {
      const { userId, userIds } = req.body;
      console.log("🚀 ~ req.body:", req.body);
      const ids = Array.isArray(userIds) ? userIds : userId ? [userId] : [];

      if (ids.length === 0) {
        throw APIError.badRequest("Provide userId or userIds");
      }

      // Fast path: if only one user is requested, regenerate credentials
      // then trigger the email without awaiting it so the API returns quickly.
      if (ids.length === 1) {
        const id = ids[0];
        try {
          const { user, userID, temporaryPassword } =
            await User.regenerateCredentialsForUser(id);

          // fire-and-forget email send
          sendUserCredentialsEmail({
            to: user.email,
            name: user.name,
            userID,
            temporaryPassword,
          }).catch((err) =>
            console.error("sendUserCredentialsEmail error:", err),
          );

          // async audit log (don't block response)
          if (req.admin?._id) {
            AuditLogModel.log({
              adminId: req.admin._id,
              action: "send_user_credentials_email",
              targetType: "user",
              targetId: id,
              details: { sentCount: 1, failedCount: 0, total: 1 },
              ipAddress: req.ip,
            }).catch((err) => console.error("AuditLogModel.log error:", err));
          }

          return APIResponse.send(res, true, 200, "Credential email queued", {
            userDbId: id,
            email: user.email,
            userID,
          });
        } catch (error) {
          next(error);
          return;
        }
      }

      const results = [];

      for (const id of ids) {
        try {
          const { user, userID, temporaryPassword } =
            await User.regenerateCredentialsForUser(id);

          // await sendUserCredentialsEmail({
          //   to: user.email,
          //   name: user.name,
          //   userID,
          //   temporaryPassword,
          // });

          results.push({
            userDbId: id,
            status: "sent",
            email: user.email,
            userID,
          });
        } catch (error) {
          results.push({
            userDbId: id,
            status: "failed",
            reason: error.message,
          });
        }
      }

      console.log("🚀 ~ results:", results);

      const sentCount = results.filter((item) => item.status === "sent").length;
      console.log("🚀 ~ sentCount:", sentCount);
      const failedCount = results.length - sentCount;

      // if (req.admin?._id) {
      //   await AuditLogModel.log({
      //     adminId: req.admin._id,
      //     action: "send_user_credentials_email",
      //     targetType: "user",
      //     details: {
      //       sentCount,
      //       failedCount,
      //       total: results.length,
      //     },
      //     ipAddress: req.ip,
      //   });
      // }

      return APIResponse.send(
        res,
        true,
        200,
        "Credentials send completed",
        sentCount,
      );
    } catch (error) {
      next(error);
    }
  },

  assignProfilesToUser: async (req, res, next) => {
    const { userId, profileIds } = req.body;

    if (!userId) {
      throw APIError.badRequest("userId is required");
    }

    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      throw APIError.badRequest("profileIds must be a non-empty array");
    }

    const result = await feedService.assignProfileToUserInSingleAndBulk(
      userId,
      profileIds,
      req.admin._id,
    );

    if (req.admin?._id) {
      await AuditLogModel.log({
        adminId: req.admin._id,
        action: "assign_profiles_to_user",
        targetType: "user",
        targetId: userId,
        details: {
          profileCount: profileIds.length,
          profileIds,
        },
        ipAddress: req.ip,
      });
    }

    return APIResponse.send(
      res,
      true,
      200,
      "Profiles assigned to user successfully",
      result,
    );
  },

  getAvailableProfilesForAssignment: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await feedService.getAvailableProfilesForAssignment(
        userId,
        { page, limit },
      );

      return APIResponse.send(
        res,
        true,
        200,
        "Available profiles retrieved successfully",
        result.profiles,
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

  updateUser: [
    fileUploader(
      [
        { name: "primaryImage", maxCount: 1 },
        { name: "secondaryImages", maxCount: 10 },
      ],
      "profiles",
    ),
    async (req, res, next) => {
      const { profileId } = req.params;
      const updateData = req.body;

      try {
        // Handle primary image upload
        if (req.files && req.files.primaryImage) {
          const file = req.files.primaryImage[0];
          updateData.primaryImage = `${file.destination}/${file.filename}`;
        }

        // Handle secondary images upload (multiple files)
        if (req.files && req.files.secondaryImages) {
          updateData.secondaryImagePaths = req.files.secondaryImages.map(
            (file) => `${file.destination}/${file.filename}`,
          );
        }

        const updatedUser = await User.updateUserById(profileId, updateData);

        const userData = {
          id: updatedUser._id,
          name: updatedUser.name,
          number: updatedUser.number,
          dob: updatedUser.dob,
          gender: updatedUser.gender,
          bio: updatedUser.bio,
          primaryImage: updatedUser.primaryImage,
          secondaryImages: updatedUser.secondaryImages,
          education: updatedUser.education,
          profession: updatedUser.profession,
          company: updatedUser.company,
          heightCm: updatedUser.heightCm,
          languages: updatedUser.languages,
          interests: updatedUser.interests,
          lifestyle: updatedUser.lifestyle,
          relationshipGoal: updatedUser.relationshipGoal,
          preferences: updatedUser.preferences,
          location: updatedUser.location,
          privacy: updatedUser.privacy,
          isVerified: updatedUser.isVerified,
          profileCompletionPercent: updatedUser.profileCompletionPercent,
          updatedAt: updatedUser.updatedAt,
        };

        const message =
          updateData.primaryImage || updateData.secondaryImagePaths
            ? "User profile and photos updated successfully"
            : "User updated successfully";

        return APIResponse.send(res, true, 200, message, userData);
      } catch (error) {
        next(error);
      }
    },
  ],
};

module.exports = adminUserController;
