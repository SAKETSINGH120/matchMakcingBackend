const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const asyncHandler = require("../../utils/asyncHandler");
const Admin = require("../../models/admin/index");
const { generateToken } = require("../../utils/jwtUtils");
const { ADMIN_ROLES } = require("../../constants");

const adminController = {
  signup: asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new APIError("All fields are required", 400);
    }

    // Validate admin role if provided
    if (role) {
      const validRoles = Object.values(ADMIN_ROLES);
      if (!validRoles.includes(role)) {
        throw new APIError(
          `Invalid role "${role}". Valid admin roles are: ${validRoles.join(", ")}`,
          400,
        );
      }
    }

    try {
      const admin = await Admin.createAdmin({ name, email, password, role });

      const token = generateToken({
        adminId: admin._id,
        email: admin.email,
        role: admin.role?.name || "admin",
      });

      return APIResponse.send(res, true, 201, "Admin created successfully", {
        ...admin,
        token,
      });
    } catch (error) {
      throw new APIError(error.message || "Signup failed", 500);
    }
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new APIError("Email and password are required", 400);
    }

    try {
      const admin = await Admin.loginAdmin(email, password);

      const token = generateToken({
        adminId: admin._id,
        email: admin.email,
        role: admin.role?.name || "admin",
      });

      return APIResponse.send(res, true, 200, "Login successful", {
        ...admin,
        token,
      });
    } catch (error) {
      throw new APIError(error.message || "Login failed", 401);
    }
  }),
  profile: asyncHandler(async (req, res) => {
    console.log(req);
    const id = req.admin._id;

    try {
      const admin = await Admin.getAdminById(id);

      return APIResponse.send(res, true, 200, "Profile Fetched Successfully", {
        admin,
      });
    } catch (error) {
      throw new APIError(error.message || "Profile fetching failed", 401);
    }
  }),
};

module.exports = adminController;
