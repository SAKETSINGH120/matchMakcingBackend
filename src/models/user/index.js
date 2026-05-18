const APIError = require("../../utils/APIError");
const User = require("./User");
const {
  generateUserCredentials,
  generatePassword,
} = require("../../utils/credentialGenerator");
const bcryptjs = require("bcryptjs");
const APIResponse = require("../../utils/APIResponse");

module.exports = {
  // Create or update user with OTP
  createUserWithOTP: async (userData) => {
    const { number } = userData;
    const otp = "1234"; // Math.floor(100000 + Math.random() * 9000).toString();

    const user = await User.findOneAndUpdate(
      { number },
      {
        ...userData,
        otp: {
          code: otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          attempts: 0,
          verified: false,
        },
      },
      { upsert: true, new: true },
    );

    console.log(`OTP for ${number}: ${otp}`);
    return { user, otp };
  },

  // Verify OTP and activate user
  verifyOTPAndActivateUser: async (number, otpCode) => {
    const user = await User.findOne({ number });

    if (!user || !user.otp) {
      throw new APIError("User not found or OTP not generated", 404);
    }

    if (new Date() > user.otp.expiresAt) {
      throw new APIError("OTP has expired", 400);
    }

    if (user.otp.attempts >= 3) {
      throw new APIError("Maximum OTP attempts exceeded", 400);
    }

    if (user.otp.code !== otpCode) {
      user.otp.attempts += 1;
      await user.save();
      throw new APIError(
        `Invalid OTP. ${3 - user.otp.attempts} attempts remaining`,
        400,
      );
    }

    user.otp.verified = true;
    user.isVerified = true;
    user.otp = undefined;
    await user.save();
    return user;
  },

  // Get user by number
  getUserbyNumber: async (number) => {
    const user = await User.findOne({ number });
    return user;
  },

  // Resend OTP
  resendOTP: async (number) => {
    const user = await User.findOne({ number });

    if (!user) {
      throw new APIError("User not found", 404);
    }

    // Check rate limit (1 minute)
    if (user.otp && user.otp.expiresAt) {
      const timeDiff =
        Date.now() - (user.otp.expiresAt.getTime() - 10 * 60 * 1000);
      if (timeDiff < 60000) {
        const remainingTime = Math.ceil((60000 - timeDiff) / 1000);
        throw new APIError(
          `Please wait ${remainingTime} seconds before requesting new OTP`,
          400,
        );
      }
    }

    const otp = "1234"; //Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      verified: false,
    };

    await user.save();
    console.log(`Resend OTP for ${number}: ${otp}`);
    return otp;
  },
  // Update user by ID
  updateUserById: async (id, updateData) => {
    const user = await User.findById(id);

    if (!user) {
      throw new APIError("User not found", 404);
    }

    if (!user.isVerified) {
      throw new APIError("User must be verified to update profile", 400);
    }

    // Fields that cannot be updated
    const protectedFields = [
      "number",
      "isVerified",
      "otp",
      "_id",
      "createdAt",
      "updatedAt",
    ];

    // Remove protected fields from update data
    const filteredUpdateData = { ...updateData };
    protectedFields.forEach((field) => delete filteredUpdateData[field]);

    // Pull out secondaryImagePaths — these go into $push, not $set
    const secondaryImagePaths = filteredUpdateData.secondaryImagePaths || [];
    delete filteredUpdateData.secondaryImagePaths;

    // Build update operation
    const updateOp = { $set: filteredUpdateData };
    if (secondaryImagePaths.length > 0) {
      updateOp.$push = { secondaryImages: { $each: secondaryImagePaths } };
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateOp, {
      new: true,
      runValidators: true,
    });

    return updatedUser;
  },

  // Upload profile photo
  uploadProfilePhoto: async (userId, photoPath) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new APIError("User not found", 404);
    }

    if (!user.isVerified) {
      throw new APIError("User must be verified to upload photos", 400);
    }

    // Set primary image and push into secondaryImages array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { primaryImage: photoPath },
        $push: { secondaryImages: photoPath },
      },
      { new: true, runValidators: true },
    );

    return updatedUser;
  },

  // Get user by ID (excluding sensitive fields)
  getUserById: async (id) => {
    const user = await User.findById(id).select("-otp -__v");
    return user;
  },

  //create user vai admin
  createUserVaiAdminWithUserIdAndPassword: async (data) => {
    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const { userID, password } = generateUserCredentials(data?.name);

        const hashedPassword = await bcryptjs.hash(password, 12);
        const user = await User.create({
          ...data,
          userID,
          password: hashedPassword,
          isNewUser: true,
          isVerified: true,
        });

        return {
          user,
          temporaryPassword: password,
        };
      } catch (error) {
        const isDuplicateUserId =
          error?.code === 11000 &&
          Object.prototype.hasOwnProperty.call(
            error.keyPattern || {},
            "userID",
          );

        if (!isDuplicateUserId) {
          throw error;
        }
      }
    }

    throw new APIError(
      "Unable to generate unique user credentials. Please try again",
      500,
    );
  },

  verifyUserIDAndPassword: async (userID, password) => {
    const user = await User.findOne({ userID });

    if (!user || !user.password) {
      throw new APIError("User not found or password not generated", 404);
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      throw new APIError("Password incorrect", 400);
    }

    user.isVerified = true;
    await user.save();
    return user;
  },

  regenerateCredentialsForUser: async (userID) => {
    const user = await User.findById(userID);
    console.log("🚀 ~ user:", user);

    if (!user) {
      throw APIError.notFound("User not found");
    }

    // if (!user.email) {
    //   throw APIError("User email is missing", 400);
    // }

    userID = user.userID;
    if (!userID) {
      throw APIError.badRequest(
        "User ID is missing for this user. Please set userID first",
      );
    }

    const temporaryPassword = generatePassword();
    const hashedPassword = await bcryptjs.hash(temporaryPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return {
      user,
      userID,
      temporaryPassword,
    };
  },

  changeUserPassword: async (id, newPassword) => {
    const hashedPassword = await bcryptjs.hash(newPassword, 12);
    const user = await User.findByIdAndUpdate(id, {
      $set: { password: hashedPassword },
    });

    if (!user) {
      throw new APIError("User not found", 404);
    }
    user.isNewUser = false;
    await user.save();
    return user;
  },

  verifyUserCurrentPassword: async (id, currentPassword) => {
    const user = await User.findById(id);

    if (!user) {
      throw new APIError("User not found ", 404);
    }

    const isMatch = await bcryptjs.compare(currentPassword, user.password);

    return isMatch;
  },
};
