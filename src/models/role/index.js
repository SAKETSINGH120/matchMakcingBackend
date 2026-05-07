const Role = require("./role");

module.exports = {
  /**
   * Create a new role with inline permissions.
   * Body: { name, description, permissions: [{ sectionName, isCreate, isRead, isUpdate, isDelete }] }
   */
  create: async ({ name, description, permissions = [] }) => {
    const existing = await Role.findOne({ name: name.toLowerCase() });
    if (existing) throw new Error(`Role "${name}" already exists`);

    // Deduplicate sections — keep last entry per sectionName
    const uniquePerms = deduplicatePermissions(permissions);

    return Role.create({ name, description, permissions: uniquePerms });
  },

  // Get all roles
  getAll: async () => {
    return Role.find().sort({ createdAt: 1 });
  },

  // Get one by ID
  getById: async (id) => {
    return Role.findById(id);
  },

  // Get one by name
  getByName: async (name) => {
    return Role.findOne({ name: name.toLowerCase() });
  },

  /**
   * Update role name, description, and/or permissions.
   */
  update: async (id, data) => {
    const role = await Role.findById(id);
    if (!role) throw new Error("Role not found");

    if (role.isDefault && data.name && data.name !== role.name) {
      throw new Error("Cannot rename a system-default role");
    }

    if (data.name !== undefined) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;

    if (data.permissions) {
      role.permissions = deduplicatePermissions(data.permissions);
    }

    await role.save();
    return role;
  },

  // Delete a role (non-default only)
  delete: async (id) => {
    const role = await Role.findById(id);
    if (!role) throw new Error("Role not found");
    if (role.isDefault) throw new Error("Cannot delete a system-default role");
    return Role.findByIdAndDelete(id);
  },
};

/**
 * Deduplicate permissions by sectionName — keeps the last entry for each section.
 */
function deduplicatePermissions(permissions) {
  const map = new Map();
  for (const perm of permissions) {
    map.set(perm.sectionName.toLowerCase(), {
      sectionName: perm.sectionName.toLowerCase(),
      isCreate: !!perm.isCreate,
      isRead: !!perm.isRead,
      isUpdate: !!perm.isUpdate,
      isDelete: !!perm.isDelete,
    });
  }
  return Array.from(map.values());
}
