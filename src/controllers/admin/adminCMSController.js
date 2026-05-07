const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const CMSModel = require("../../models/cms/index");
const AuditLogModel = require("../../models/auditLog/index");

const adminCMSController = {
  getAll: async (req, res, next) => {
    try {
      const pages = await CMSModel.find()
        .populate("lastUpdatedBy", "name email")
        .sort({ updatedAt: -1 });

      return APIResponse.send(
        res,
        true,
        200,
        "CMS pages retrieved successfully",
        pages,
      );
    } catch (error) {
      next(error);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const page = await CMSModel.findOne({
        pageType: req.params.pageType,
      }).populate("lastUpdatedBy", "name email");

      if (!page) {
        throw new APIError("Page not found", 404);
      }

      return APIResponse.send(
        res,
        true,
        200,
        "Page retrieved successfully",
        page,
      );
    } catch (error) {
      next(error);
    }
  },

  createOrUpdate: async (req, res, next) => {
    try {
      const { pageType, content, isActive = true } = req.body;

      let page = await CMSModel.findOne({ pageType });
      let isNew = false;

      if (page) {
        page.content = content;
        if (isActive !== undefined) page.isActive = isActive;
        page.lastUpdatedBy = req.admin._id;
        await page.save();
      } else {
        isNew = true;
        page = await CMSModel.create({
          pageType,
          content,
          isActive: isActive !== undefined ? isActive : true,
          lastUpdatedBy: req.admin._id,
        });
      }

      return APIResponse.send(
        res,
        true,
        isNew ? 201 : 200,
        `Page ${isNew ? "created" : "updated"} successfully`,
        page,
      );
    } catch (error) {
      next(error);
    }
  },

  toggleStatus: async (req, res, next) => {
    try {
      const page = await CMSModel.findOne({ pageType: req.params.pageType });

      if (!page) {
        throw new APIError("Page not found", 404);
      }

      page.isActive = !page.isActive;
      page.lastUpdatedBy = req.admin._id;
      await page.save();

      // Audit log
      await AuditLogModel.create({
        admin: req.admin._id,
        action: "TOGGLE_CMS_STATUS",
        resource: "CMS",
        resourceId: page._id,
        details: `Toggled ${page.pageType} to ${page.isActive ? "active" : "inactive"}`,
      });

      return APIResponse.send(
        res,
        true,
        200,
        `Page ${page.isActive ? "activated" : "deactivated"} successfully`,
        page,
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminCMSController;
