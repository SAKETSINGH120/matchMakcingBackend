const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const APIError = require("./APIError");
const EmailTemplateRepository = require("../models/emailTemplate/index");

let cachedTransporter = null;

const TEMPLATE_NAME = "user_credentials_email";
const DEFAULT_EMAIL_SUBJECT = "Welcome to The Bond Agency - Your Account Credentials";
const DEFAULT_INTRO_TEXT = "Welcome to The Bond Agency! Your account has been successfully created. Below are your login credentials to get started.";
const DEFAULT_SECURITY_MESSAGE = "This is a temporary password. For your account security, please log in immediately and change your password to something unique and secure that only you know.";
const DEFAULT_BUTTON_TEXT = "Go to Login";
const DEFAULT_HELP_MESSAGE = "If you face any issues logging in or have questions, please contact our support team at";

const getAppLoginUrl = () =>
  process.env.APP_LOGIN_URL || "https://app.thebondagency.com/login";

const getSupportEmail = () =>
  process.env.APP_SUPPORT_EMAIL || "support@thebondagency.com";

const emailLayoutTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; }
      .header { background: #000; color: white; padding: 40px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { background: white; padding: 30px 20px; }
      .welcome { font-size: 16px; margin-bottom: 24px; }
      .intro-text { color: #666; margin-bottom: 20px; font-size: 15px; }
      .credentials-box { background: #f5f5f5; border-left: 4px solid #000; padding: 20px; margin: 24px 0; border-radius: 4px; }
      .credentials-box h3 { margin: 0 0 16px 0; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .credential-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
      .credential-item:last-child { border-bottom: none; }
      .credential-label { font-weight: 600; color: #000; min-width: 140px; }
      .credential-value { color: #333; word-break: break-all; }
      .security-notice { background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px; }
      .security-notice h4 { margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: 600; }
      .security-notice p { margin: 0; color: #856404; font-size: 13px; line-height: 1.5; }
      .action-button { display: inline-block; background: #000; color: white; text-decoration: none; padding: 12px 32px; border-radius: 4px; margin: 24px 0; font-weight: 600; font-size: 15px; }
      .footer { background: #f9f9f9; padding: 24px 20px; text-align: center; border-top: 1px solid #e0e0e0; }
      .footer-text { color: #999; font-size: 12px; margin: 0 0 8px 0; line-height: 1.4; }
      .footer-links { margin: 12px 0 0 0; }
      .footer-links a { color: #000; text-decoration: none; font-size: 12px; margin: 0 12px; }
      .footer-links a:hover { text-decoration: underline; }
      @media (max-width: 600px) {
        .credential-item { flex-direction: column; }
        .credential-label { margin-bottom: 4px; }
        .header h1 { font-size: 24px; }
        .content { padding: 20px 15px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>The Bond Agency</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Your Account is Ready</p>
      </div>

      <div class="content">
        {{{body}}}
      </div>

      <div class="footer">
        <p class="footer-text">The Bond Agency © {{currentYear}}. All rights reserved.</p>
        <p class="footer-text">This is an automated message. Please do not reply to this email.</p>
        <div class="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Support</a>
        </div>
      </div>
    </div>
  </body>
  </html>
`;

const stripHtml = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildFallbackTemplate = () => ({
  subject: DEFAULT_EMAIL_SUBJECT,
  introText: DEFAULT_INTRO_TEXT,
  securityMessage: DEFAULT_SECURITY_MESSAGE,
  buttonText: DEFAULT_BUTTON_TEXT,
  helpMessage: DEFAULT_HELP_MESSAGE,
});

const getEmailTemplateByName = async (name) => {
  return EmailTemplateRepository.findByName(name);
};

const renderEmailLayout = ({ body, currentYear }) => {
  const layout = Handlebars.compile(emailLayoutTemplate);
  return layout({ body, currentYear });
};

const renderFullEmail = ({
  subject,
  introText,
  securityMessage,
  buttonText,
  helpMessage,
  name,
  userID,
  temporaryPassword,
}) => {
  const currentYear = new Date().getFullYear();
  const templateData = {
    name: name || "User",
    userID: userID || "john.doe@example.com",
    temporaryPassword: temporaryPassword || "T3mpP@ssw0rd!",
    loginUrl: getAppLoginUrl(),
    supportEmail: getSupportEmail(),
    currentYear,
  };

  const resolvedSubject = Handlebars.compile(subject || DEFAULT_EMAIL_SUBJECT)(templateData);

  const bodyHtml = `
    <div class="welcome">
      <p>Hello <strong>{{name}}</strong>,</p>
      <p class="intro-text">${introText || DEFAULT_INTRO_TEXT}</p>
    </div>

    <div class="credentials-box">
      <h3>Your Login Credentials</h3>
      <div class="credential-item">
        <div class="credential-label">User ID:</div>
        <div class="credential-value"><code style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px; font-family: 'Courier New', monospace; font-weight: 500;">{{userID}}</code></div>
      </div>
      <div class="credential-item">
        <div class="credential-label">Temporary Password:</div>
        <div class="credential-value"><code style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px; font-family: 'Courier New', monospace; font-weight: 500;">{{temporaryPassword}}</code></div>
      </div>
    </div>

    <div class="security-notice">
      <h4>Security Notice</h4>
      <p>${securityMessage || DEFAULT_SECURITY_MESSAGE}</p>
    </div>

    <div style="text-align: center;">
      <a href="{{loginUrl}}" class="action-button">${buttonText || DEFAULT_BUTTON_TEXT}</a>
    </div>

    <p style="color: #999; font-size: 13px; margin-top: 24px;">
      <strong>Need Help?</strong> ${helpMessage || DEFAULT_HELP_MESSAGE} <a href="mailto:{{supportEmail}}" style="color: #667eea; text-decoration: none;">{{supportEmail}}</a>
    </p>
  `;

  const compiledBody = Handlebars.compile(bodyHtml)(templateData);
  const finalHtml = renderEmailLayout({
    body: compiledBody,
    currentYear,
  });

  return {
    subject: resolvedSubject,
    html: finalHtml,
    text: stripHtml(compiledBody),
  };
};

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE } =
    process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw APIError.internal(
      "SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM",
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return cachedTransporter;
};

const sendUserCredentialsEmail = async ({
  to,
  name,
  userID,
  temporaryPassword,
  subject,
  body,
}) => {
  const transporter = getTransporter();
  const currentYear = new Date().getFullYear();
  const templateData = {
    name: name || "User",
    userID,
    temporaryPassword,
    loginUrl: getAppLoginUrl(),
    supportEmail: getSupportEmail(),
    currentYear,
  };

  const template =
    (await getEmailTemplateByName(TEMPLATE_NAME)) || buildFallbackTemplate();

  let rendered;
  if (body) {
    // Backward compatibility: if full custom HTML is passed, render it
    const compiledBody = Handlebars.compile(body)(templateData);
    const finalHtml = renderEmailLayout({
      body: compiledBody,
      currentYear,
    });
    rendered = {
      subject: subject || template.subject || DEFAULT_EMAIL_SUBJECT,
      html: finalHtml,
      text: stripHtml(compiledBody),
    };
  } else {
    // Modern structured render
    rendered = renderFullEmail({
      subject: subject || template.subject,
      introText: template.introText,
      securityMessage: template.securityMessage,
      buttonText: template.buttonText,
      helpMessage: template.helpMessage,
      name,
      userID,
      temporaryPassword,
    });
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
};

const migrateTemplates = async () => {
  try {
    const EmailTemplate = require("../models/emailTemplate/EmailTemplate");
    const templates = await EmailTemplate.find({});

    for (const template of templates) {
      if (!template.introText && template.body) {
        console.log(`[Migration] Migrating email template: ${template.name}`);

        const introMatch = template.body.match(/class="intro-text"[^>]*>([\s\S]*?)<\/p>/i) ||
                           template.body.match(/<p class="intro-text">([\s\S]*?)<\/p>/i);
        const securityMatch = template.body.match(/<div class="security-notice">[\s\S]*?<p>([\s\S]*?)<\/p>/i) ||
                              template.body.match(/class="security-notice"[\s\S]*?<p>([\s\S]*?)<\/p>/i);
        const buttonMatch = template.body.match(/<a[^>]*class="action-button"[^>]*>([\s\S]*?)<\/a>/i);
        const helpMatch = template.body.match(/<strong>Need Help\??<\/strong>\s*([\s\S]*?)\s*<a/i);

        const stripTags = (str) => str ? str.replace(/<[^>]+>/g, "").trim() : "";

        const introText = introMatch ? stripTags(introMatch[1]) : DEFAULT_INTRO_TEXT;
        const securityMessage = securityMatch ? stripTags(securityMatch[1]) : DEFAULT_SECURITY_MESSAGE;
        const buttonText = buttonMatch ? stripTags(buttonMatch[1]) : DEFAULT_BUTTON_TEXT;
        const helpMessage = helpMatch ? stripTags(helpMatch[1]) : DEFAULT_HELP_MESSAGE;

        template.introText = introText;
        template.securityMessage = securityMessage;
        template.buttonText = buttonText;
        template.helpMessage = helpMessage;
        template.set("body", undefined);

        await template.save();
        console.log(`[Migration] Successfully migrated email template: ${template.name}`);
      }
    }

    // Seed default template if none exists
    const existing = await EmailTemplate.findOne({ name: TEMPLATE_NAME });
    if (!existing) {
      console.log(`[Migration] Seeding default email template: ${TEMPLATE_NAME}`);
      await EmailTemplate.create({
        name: TEMPLATE_NAME,
        subject: DEFAULT_EMAIL_SUBJECT,
        introText: DEFAULT_INTRO_TEXT,
        securityMessage: DEFAULT_SECURITY_MESSAGE,
        buttonText: DEFAULT_BUTTON_TEXT,
        helpMessage: DEFAULT_HELP_MESSAGE,
        isActive: true,
      });
      console.log(`[Migration] Successfully seeded default email template.`);
    }
  } catch (error) {
    console.error("[Migration] Error migrating email templates:", error);
  }
};

module.exports = {
  sendUserCredentialsEmail,
  renderFullEmail,
  migrateTemplates,
  TEMPLATE_NAME,
  DEFAULT_EMAIL_SUBJECT,
};
