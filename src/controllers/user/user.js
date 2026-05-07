const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const User = require("../../models/user/index");
const { generateToken } = require("../../utils/jwtUtils");
const fileUploader = require("../../utils/fileUploader");
const path = require("path");

const userController = {
  registerUser: async (req, res, next) => {
    const userData = req.body;
    const { number } = userData;

    try {
      const existingUser = await User.getUserbyNumber(number);
      let newUser = false;
      let user;

      if (!existingUser) {
        const result = await User.createUserWithOTP(userData);
        user = result.user;
        newUser = true;
      } else {
        const result = await User.createUserWithOTP(userData);
        user = result.user;
        newUser = false;
      }
      const responseData = {
        message: "OTP sent to your phone number",
        number: user.number,
        name: user.name,
        expiresAt: user.otp.expiresAt,
        newUser: newUser,
      };

      return APIResponse.send(
        res,
        true,
        201,
        newUser
          ? "Registration initiated. Please verify OTP"
          : "Welcome back! Please verify OTP",
        responseData,
      );
    } catch (error) {
      next(error);
    }
  },

  verifyOTP: async (req, res, next) => {
    const { number, otp } = req.body;

    if (!number || !otp) {
      throw new APIError("Phone number and OTP are required", 400);
    }

    try {
      const user = await User.verifyOTPAndActivateUser(number, otp);

      const token = generateToken({
        userId: user._id,
        number: user.number,
        isVerified: user.isVerified,
      });

      const userData = {
        id: user._id,
        name: user.name,
        number: user.number,
        dob: user.dob,
        gender: user.gender,
        bio: user.bio,
        primaryImage: user.primaryImage,
        secondaryImages: user.secondaryImages,
        education: user.education,
        profession: user.profession,
        company: user.company,
        heightCm: user.heightCm,
        languages: user.languages,
        interests: user.interests,
        lifestyle: user.lifestyle,
        relationshipGoal: user.relationshipGoal,
        preferences: user.preferences,
        location: user.location,
        privacy: user.privacy,
        isVerified: user.isVerified,
        profileCompletionPercent: user.profileCompletionPercent,
        createdAt: user.createdAt,
        token: token,
      };

      return APIResponse.send(
        res,
        true,
        200,
        "Registration completed successfully",
        userData,
      );
    } catch (error) {
      console.log("Error in OTP verification:", error);
      next(error);
    }
  },

  resendOTP: async (req, res, next) => {
    const { number } = req.body;

    if (!number) {
      throw new APIError("Phone number is required", 400);
    }

    try {
      await User.resendOTP(number);

      return APIResponse.send(res, true, 200, "OTP resent successfully", {
        number,
        message: "New OTP sent to your phone number",
      });
    } catch (error) {
      next(error);
    }
  },

  getProfile: async (req, res, next) => {
    try {
      const user = req.user;

      // Profile is pending if fields beyond name, gender, number, dob are not filled
      const profileDetailsPending =
        !user.bio ||
        !user.primaryImage ||
        !user.interests?.length ||
        !user.preferences;

      return APIResponse.send(
        res,
        true,
        200,
        "Profile retrieved successfully",
        {
          id: user._id,
          name: user.name,
          number: user.number,
          dob: user.dob,
          gender: user.gender,
          bio: user.bio,
          primaryImage: user.primaryImage,
          secondaryImages: user.secondaryImages,
          education: user.education,
          profession: user.profession,
          company: user.company,
          heightCm: user.heightCm,
          languages: user.languages,
          interests: user.interests,
          lifestyle: user.lifestyle,
          relationshipGoal: user.relationshipGoal,
          preferences: user.preferences,
          location: user.location,
          privacy: user.privacy,
          isVerified: user.isVerified,
          isPremium: user.isPremium,
          profileDetailsPending,
          // profileCompletionPercent: user.profileCompletionPercent,
          lastActiveAt: user.lastActiveAt,
          createdAt: user.createdAt,
        },
      );
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (req, res, next) => {
    const { id } = req.params;

    try {
      const user = await User.getUserById(id);

      if (!user) {
        throw new APIError("User not found", 404);
      }

      const userData = {
        id: user._id,
        name: user.name,
        number: user.number,
        dob: user.dob,
        gender: user.gender,
        bio: user.bio,
        primaryImage: user.primaryImage,
        secondaryImages: user.secondaryImages,
        education: user.education,
        profession: user.profession,
        company: user.company,
        heightCm: user.heightCm,
        languages: user.languages,
        interests: user.interests,
        lifestyle: user.lifestyle,
        relationshipGoal: user.relationshipGoal,
        preferences: user.preferences,
        location: user.location,
        privacy: user.privacy,
        isVerified: user.isVerified,
        isPremium: user.isPremium,
        profileCompletionPercent: user.profileCompletionPercent,
        createdAt: user.createdAt,
      };

      return APIResponse.send(
        res,
        true,
        200,
        "User retrieved successfully",
        userData,
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
      const id = req.user._id;
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

        const updatedUser = await User.updateUserById(id, updateData);

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

  login: async (req, res, next) => {
    const { userID, password } = req.body;
    console.log("🚀 ~ userID, password:", userID, password);

    if (!userID || !password) {
      throw new APIError("userID and password are required", 400);
    }

    try {
      const user = await User.verifyUserIDAndPassword(userID, password);

      const token = generateToken({
        userId: user._id,
        number: user.number,
        isVerified: user.isVerified,
      });

      const userData = {
        id: user._id,
        name: user.name,
        number: user.number,
        dob: user.dob,
        gender: user.gender,
        bio: user.bio,
        primaryImage: user.primaryImage,
        secondaryImages: user.secondaryImages,
        education: user.education,
        profession: user.profession,
        company: user.company,
        heightCm: user.heightCm,
        languages: user.languages,
        interests: user.interests,
        lifestyle: user.lifestyle,
        relationshipGoal: user.relationshipGoal,
        preferences: user.preferences,
        location: user.location,
        privacy: user.privacy,
        isVerified: user.isVerified,
        profileCompletionPercent: user.profileCompletionPercent,
        createdAt: user.createdAt,
        token: token,
        isNewUser: user.isNewUser,
      };

      return APIResponse.send(
        res,
        true,
        200,
        "User logged-in successfully",
        userData,
      );
    } catch (error) {
      console.log("Error in login:", error);
      next(error);
    }
  },

  changePassword: async (req, res, next) => {
    const id = req.user._id;
    const { currentPassword, newPassword } = req.body;
    console.log("🚀 ~ req.body:", req.body);

    if (!currentPassword || !newPassword) {
      throw new APIError("currentPassword and newPassword are required", 400);
    }

    const isCorrect = await User.verifyUserCurrentPassword(id, currentPassword);

    if (!isCorrect) {
      throw new APIError("currentPassword is incorrect ", 400);
    }

    const userData = await User.changeUserPassword(id, newPassword);
    userData.inNewUser = userData.isNewUser;

    return APIResponse.send(
      res,
      true,
      200,
      "User password changed successfully",
      userData,
    );
  },
};

module.exports = userController;
