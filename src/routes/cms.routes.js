const express = require("express");
const router = express.Router();
const cmsController = require("../controllers/cms/cms");
const cmsValidator = require("../controllers/cms/validator");
const asyncHandler = require("../utils/asyncHandler");

router.get("/", asyncHandler(cmsController.getAll));

router.get(
  "/:pageType",
  cmsValidator.pageTypeParam,
  asyncHandler(cmsController.getOne),
);

module.exports = router;
