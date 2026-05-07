const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/user");
const { userValidator } = require("../controllers/user/validator");
const { validator } = require("../utils/requestParamsValidator");
const asyncHandler = require("../utils/asyncHandler");
const { authenticateUser } = require("../middlewares/auth");
const { adminValidator } = require("../controllers/admin/validator");

router.post(
  "/register",
  userValidator.registerUser,
  userController.registerUser,
);

router.post("/verify-otp", validator.verifyOTP, userController.verifyOTP);
router.post("/resend-otp", validator.resendOTP, userController.resendOTP);

router.get(
  "/profile",
  authenticateUser,
  asyncHandler(userController.getProfile),
);

router.get(
  "/:id",
  validator.mongoId("id"),
  asyncHandler(userController.getUserById),
);

router.put(
  "/update",
  authenticateUser,
  userValidator.updateUser,
  userController.updateUser,
);

router.delete(
  "/:id",
  validator.mongoId("id"),
  asyncHandler(userController.deleteUser),
);

router.post(
  "/login",
  // authorize("users", "read"),
  userValidator.userLogin,
  asyncHandler(userController.login),
);

router.post(
  "/change-password",
  userValidator.changePasswordValidator,
  authenticateUser,
  asyncHandler(userController.changePassword),
);

module.exports = router;
