const APIResponse = require("../../utils/APIResponse");
const EmailTemplate = require("../../models/emailTemplate/EmailTemplate");
const { renderFullEmail } = require("../../utils/credentialMailer");

const SINGLE_TEMPLATE_NAME = "user_credentials_email";

const toTemplateResponse = (template) => {
  if (!template) {
    return null;
  }

  return {
    _id: template._id,
    name: template.name,
    subject: template.subject,
    introText: template.introText,
    securityMessage: template.securityMessage,
    buttonText: template.buttonText,
    helpMessage: template.helpMessage,
    isActive: template.isActive,
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
      const { subject, introText, securityMessage, buttonText, helpMessage, isActive = true } = req.body;

      let template = await EmailTemplate.findOne({
        name: SINGLE_TEMPLATE_NAME,
      });
      const isNew = !template;

      if (template) {
        template.subject = subject;
        template.introText = introText;
        template.securityMessage = securityMessage;
        template.buttonText = buttonText;
        template.helpMessage = helpMessage;
        template.isActive =
          isActive !== undefined ? isActive : template.isActive;
        template.updatedBy = req.admin._id;
        await template.save();
      } else {
        template = await EmailTemplate.create({
          name: SINGLE_TEMPLATE_NAME,
          subject,
          introText,
          securityMessage,
          buttonText,
          helpMessage,
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

  preview: async (req, res, next) => {
    try {
      const { subject, introText, securityMessage, buttonText, helpMessage } = req.body;

      const rendered = renderFullEmail({
        subject,
        introText,
        securityMessage,
        buttonText,
        helpMessage,
        name: "John Doe",
        userID: "john.doe@example.com",
        temporaryPassword: "T3mpP@ssw0rd!",
      });

      return APIResponse.send(
        res,
        true,
        200,
        "Email template preview generated successfully",
        {
          subject: rendered.subject,
          html: rendered.html,
        },
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminEmailTemplateController;
