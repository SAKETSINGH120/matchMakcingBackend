const APIResponse = require("../../utils/APIResponse");
const EmailTemplate = require("../../models/emailTemplate/EmailTemplate");

const SINGLE_TEMPLATE_NAME = "user_credentials_email";

const toTemplateResponse = (template) => {
  if (!template) {
    return null;
  }

  return {
    body: template.body,
    subject: template.subject,
    isActive: template.isActive,
    name: template.name,
    _id: template._id,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    updatedBy: template.updatedBy,
  };
};

const adminEmailTemplateController = {
  getCurrent: async (req, res, next) => {
    try {
      const template = await EmailTemplate.findOne({
        name: SINGLE_TEMPLATE_NAME,
      })
        .populate("updatedBy", "name email")
        .lean();

      return APIResponse.send(
        res,
        true,
        200,
        "Email template retrieved successfully",
        toTemplateResponse(template),
      );
    } catch (error) {
      next(error);
    }
  },

  createOrUpdate: async (req, res, next) => {
    try {
      const { subject, body, isActive = true } = req.body;

      let template = await EmailTemplate.findOne({
        name: SINGLE_TEMPLATE_NAME,
      });
      const isNew = !template;

      if (template) {
        template.subject = subject;
        template.body = body;
        template.isActive =
          isActive !== undefined ? isActive : template.isActive;
        template.updatedBy = req.admin._id;
        await template.save();
      } else {
        template = await EmailTemplate.create({
          name: SINGLE_TEMPLATE_NAME,
          subject,
          body,
          isActive: isActive !== undefined ? isActive : true,
          updatedBy: req.admin._id,
        });
      }

      const populated = await EmailTemplate.findById(template._id)
        .populate("updatedBy", "name email")
        .lean();

      return APIResponse.send(
        res,
        true,
        isNew ? 201 : 200,
        `Email template ${isNew ? "created" : "updated"} successfully`,
        toTemplateResponse(populated),
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminEmailTemplateController;
