const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const APIError = require("./APIError");
const EmailTemplateRepository = require("../models/emailTemplate/index");

let cachedTransporter = null;

const TEMPLATE_NAME = "user_credentials_email";
const DEFAULT_EMAIL_SUBJECT =
  "Welcome to The Bond Agency - Your Account Credentials";

const getAppLoginUrl = () =>
  process.env.APP_LOGIN_URL || "https://app.thebondagency.com/login";

const getSupportEmail = () =>
  process.env.APP_SUPPORT_EMAIL || "support@thebondagency.com";

const DEFAULT_CREDENTIALS_EMAIL_BODY = `
  <div class="welcome">
    <p>Hello <strong>{{name}}</strong>,</p>
    <p class="intro-text">Welcome to The Bond Agency! Your account has been successfully created. Below are your login credentials to get started.</p>
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
    <p>This is a temporary password. For your account security, please log in immediately and change your password to something unique and secure that only you know.</p>
  </div>

  <div style="text-align: center;">
    <a href="{{loginUrl}}" class="action-button">Go to Login</a>
  </div>

  <p style="color: #999; font-size: 13px; margin-top: 24px;">
    <strong>Need Help?</strong> If you face any issues logging in or have questions, please contact our support team at <a href="mailto:{{supportEmail}}" style="color: #667eea; text-decoration: none;">{{supportEmail}}</a>
  </p>
`;

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
  body: DEFAULT_CREDENTIALS_EMAIL_BODY,
});

const getEmailTemplateByName = async (name) => {
  return EmailTemplateRepository.findByName(name);
};

const renderEmailLayout = ({ body, currentYear }) => {
  const layout = Handlebars.compile(emailLayoutTemplate);
  return layout({ body, currentYear });
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
  const templateBody = body || template.body;
  const templateSubject = subject || template.subject || DEFAULT_EMAIL_SUBJECT;

  const compiledBody = Handlebars.compile(templateBody)(templateData);
  const finalHtml = renderEmailLayout({
    body: compiledBody,
    currentYear,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: templateSubject,
    text: stripHtml(compiledBody),
    html: finalHtml,
  });
};

module.exports = {
  sendUserCredentialsEmail,
  DEFAULT_CREDENTIALS_EMAIL_BODY,
  DEFAULT_EMAIL_SUBJECT,
};
