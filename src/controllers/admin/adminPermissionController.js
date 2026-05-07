const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const asyncHandler = require("../../utils/asyncHandler");
const PermissionService = require("../../models/permission/index");

const adminPermissionController = {
  getAll: asyncHandler(async (req, res) => {
    const permissions = await PermissionService.getAll();
    return APIResponse.send(res, true, 200, "Permissions fetched", permissions);
  }),

  getById: asyncHandler(async (req, res) => {
    const permission = await PermissionService.getById(req.params.id);
    if (!permission) throw APIError.notFound("Permission not found");
    return APIResponse.send(res, true, 200, "Permission fetched", permission);
  }),

  create: asyncHandler(async (req, res) => {
    const { sectionName } = req.body;

    if (!sectionName) {
      throw APIError.badRequest("sectionName is required");
    }

    const permission = await PermissionService.create(req.body);
    return APIResponse.send(
      res,
      true,
      201,
      "Permission created and automatically assigned to super_admin",
      permission,
    );
  }),

  update: asyncHandler(async (req, res) => {
    const permission = await PermissionService.update(req.params.id, req.body);
    return APIResponse.send(res, true, 200, "Permission updated", permission);
  }),

  delete: asyncHandler(async (req, res) => {
    await PermissionService.delete(req.params.id);
    return APIResponse.send(res, true, 200, "Permission deleted");
  }),
};

module.exports = adminPermissionController;
