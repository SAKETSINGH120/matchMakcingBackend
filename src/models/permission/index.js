const Permission = require("./Permission");
const { ADMIN_ROLES } = require("../../constants");

module.exports = {
  // Create a new section permission
  create: async (data) => {
    // Check using section name if duplicate exists then don't create again
    const sectionAlreadyExists = await Permission.findOne({
      sectionName: data.sectionName,
    });

    if (sectionAlreadyExists) {
      throw new Error("Permission already exists with this section name");
    }

    const newPermission = await Permission.create(data);

    // Automatically assign the new permission to super_admin role
    try {
      const Role = require("../role/role");
      await Role.findOneAndUpdate(
        { name: ADMIN_ROLES.SUPER_ADMIN },
        { $addToSet: { permissions: newPermission._id } },
        { new: true },
      );
      console.log(
        `✓ Permission '${data.sectionName}' automatically assigned to super_admin`,
      );
    } catch (error) {
      console.error(
        `Warning: Could not assign permission to super_admin:`,
        error.message,
      );
    }

    return newPermission;
  },

  // Get all permissions
  getAll: async () => {
    return Permission.find().sort({ sectionName: 1 });
  },

  // Get one by ID
  getById: async (id) => {
    return Permission.findById(id);
  },

  // Update a permission (toggle CRUD flags, rename section, etc.)
  update: async (id, data) => {
    // Check if sectionName is being changed and if it already exists
    if (data.sectionName) {
      const sectionAlreadyExists = await Permission.findOne({
        sectionName: data.sectionName,
        _id: { $ne: id }, // Exclude current permission from check
      });

      if (sectionAlreadyExists) {
        throw new Error("Permission already exists with this section name");
      }
    }

    const permission = await Permission.findById(id);
    if (!permission) throw new Error("Permission not found");
    Object.assign(permission, data);
    return permission.save();
  },

  // Delete a permission and remove it from all roles
  delete: async (id) => {
    const permission = await Permission.findById(id);
    if (!permission) throw new Error("Permission not found");

    const Role = require("../role/role");
    await Role.updateMany({ permissions: id }, { $pull: { permissions: id } });

    return Permission.findByIdAndDelete(id);
  },

  // Utility function: Assign all existing permissions to super_admin
  assignAllToSuperAdmin: async () => {
    try {
      const Role = require("../role/role");
      const allPermissions = await Permission.find({}, "_id");
      const permissionIds = allPermissions.map((p) => p._id);

      const result = await Role.findOneAndUpdate(
        { name: ADMIN_ROLES.SUPER_ADMIN },
        { $addToSet: { permissions: { $each: permissionIds } } },
        { new: true, upsert: true },
      );

      console.log(
        `✓ Assigned ${permissionIds.length} permissions to super_admin`,
      );
      return result;
    } catch (error) {
      console.error(
        "Error assigning permissions to super_admin:",
        error.message,
      );
      throw error;
    }
  },
};
