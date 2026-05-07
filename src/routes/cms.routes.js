const express = require("express");
const router = express.Router();
const cmsController = require("../controllers/cms/cms");
const cmsValidator = require("../controllers/cms/validator");
const asyncHandler = require("../utils/asyncHandler");

// Public routes - no authentication required

// Get all active pages
router.get("/", asyncHandler(cmsController.getAll));

// Get specific page by pageType
router.get(
  "/:pageType",
  cmsValidator.pageTypeParam,
  asyncHandler(cmsController.getOne),
);

module.exports = router;
