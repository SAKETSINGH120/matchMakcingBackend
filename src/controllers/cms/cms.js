const APIResponse = require("../../utils/APIResponse");
const APIError = require("../../utils/APIError");
const CMSModel = require("../../models/cms/index");

const cmsController = {
  // Get all active pages
  getAll: async (req, res, next) => {
    try {
      const pages = await CMSModel.find({ isActive: true })
        .select("pageType updatedAt")
        .sort({ pageType: 1 });

      return APIResponse.send(
        res,
        true,
        200,
        "Pages retrieved successfully",
        pages,
      );
    } catch (error) {
      next(error);
    }
  },

  // Get single page by pageType
  getOne: async (req, res, next) => {
    try {
      const page = await CMSModel.findOne({
        pageType: req.params.pageType,
        isActive: true,
      }).select("pageType content updatedAt");

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
};

module.exports = cmsController;
