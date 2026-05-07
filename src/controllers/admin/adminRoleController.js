const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const asyncHandler = require("../../utils/asyncHandler");
const RoleService = require("../../models/role/index");

const adminRoleController = {
  getAll: asyncHandler(async (req, res) => {
    const roles = await RoleService.getAll();
    return APIResponse.send(res, true, 200, "Roles fetched", roles);
  }),

  getById: asyncHandler(async (req, res) => {
    const role = await RoleService.getById(req.params.id);
    if (!role) throw APIError.notFound("Role not found");
    return APIResponse.send(res, true, 200, "Role fetched", role);
  }),

  create: asyncHandler(async (req, res) => {
    const { name, description, permissions } = req.body;

    const role = await RoleService.create({ name, description, permissions });
    return APIResponse.send(res, true, 201, "Role created", role);
  }),

  update: asyncHandler(async (req, res) => {
    const { name, description, permissions } = req.body;
    const role = await RoleService.update(req.params.id, {
      name,
      description,
      permissions,
    });
    return APIResponse.send(res, true, 200, "Role updated", role);
  }),

  delete: asyncHandler(async (req, res) => {
    await RoleService.delete(req.params.id);
    return APIResponse.send(res, true, 200, "Role deleted");
  }),
};

module.exports = adminRoleController;
