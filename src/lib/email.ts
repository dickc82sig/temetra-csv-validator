/**
 * Email Service
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This file handles sending emails for validation results and notifications.
 * It uses Nodemailer to send emails via SMTP.
 *
 * SETUP REQUIRED:
 * You need to configure SMTP settings in your .env.local file.
 * See .env.example for the required variables.
 */

import nodemailer from 'nodemailer';
import { isAlex, getDisplayName } from './utils';
import { ValidationResult } from './csv-validator';

// Email configuration from environment variables
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

// Sender info
const fromName = process.env.EMAIL_FROM_NAME || 'Temetra CSV Validator';
const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com';

/**
 * Create a Nodemailer transporter
 * This is the "connection" to the email server
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465, // true for 465, false for other ports
    auth: smtpConfig.auth,
  });
}

/**
 * Send validation results email to developer
 *
 * @param to - Recipient email address
 * @param name - Recipient name
 * @param fileName - Name of the uploaded file
 * @param results - Validation results
 * @param projectName - Name of the project
 */
export async function sendValidationResultsEmail(
  to: string,
  name: string,
  fileName: string,
  results: ValidationResult,
  projectName: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    // Check for the Alex easter egg
    const displayName = isAlex(name) ? 'Alexa' : name;
    const greeting = isAlex(name) ? 'Hi Alexa!' : `Hello ${name},`;

    // Build the email subject
    const statusEmoji = results.isValid ? '✅' : '❌';
    const subject = `${statusEmoji} CSV Validation Results - ${fileName}`;

    // Build error summary for the email
    let errorSummary = '';
    if (results.totalErrors > 0 || results.totalWarnings > 0) {
      errorSummary = `
### Issues Found

**Errors:** ${results.totalErrors}
**Warnings:** ${results.totalWarnings}

`;
      // Group errors by column
      const errorsByColumn: Record<string, number> = {};
      results.errors.forEach(err => {
        errorsByColumn[err.column] = (errorsByColumn[err.column] || 0) + 1;
      });

      Object.entries(errorsByColumn).slice(0, 10).forEach(([col, count]) => {
        errorSummary += `- **${col}**: ${count} issues\n`;
      });

      if (Object.keys(errorsByColumn).length > 10) {
        errorSummary += `- ... and ${Object.keys(errorsByColumn).length - 10} more columns\n`;
      }
    }

    // Build the HTML email body
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${results.isValid ? '#22c55e' : '#ef4444'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .stats { display: flex; gap: 20px; margin: 20px 0; }
    .stat { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; flex: 1; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .error-list { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 15px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${results.isValid ? '✅ Validation Passed' : '❌ Validation Failed'}</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Project: ${projectName}</p>
    </div>

    <div class="content">
      <p>${greeting}</p>

      <p>Your CSV file <strong>${fileName}</strong> has been validated.</p>

      <div class="stats">
        <div class="stat">
          <div class="stat-value">${results.totalRows}</div>
          <div class="stat-label">Rows Checked</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: ${results.totalErrors > 0 ? '#ef4444' : '#22c55e'};">${results.totalErrors}</div>
          <div class="stat-label">Errors</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: ${results.totalWarnings > 0 ? '#f59e0b' : '#22c55e'};">${results.totalWarnings}</div>
          <div class="stat-label">Warnings</div>
        </div>
      </div>

      ${results.isValid ? `
        <p style="color: #22c55e;">🎉 Great job! Your file passed all validation checks and is ready for import.</p>
      ` : `
        <div class="error-list">
          <h3 style="margin-top: 0;">Issues to Fix:</h3>
          <p>${results.summary}</p>
          ${results.errors.slice(0, 5).map(err => `
            <p style="margin: 8px 0; padding: 8px; background: #fef2f2; border-radius: 4px; font-size: 14px;">
              <strong>Row ${err.row}, ${err.column}:</strong> ${err.message}
            </p>
          `).join('')}
          ${results.errors.length > 5 ? `<p style="color: #6b7280;">... and ${results.errors.length - 5} more errors</p>` : ''}
        </div>
        <p>Please fix these issues and re-upload your file.</p>
      `}

      <div class="footer">
        <p>This is an automated message from Temetra CSV Validator.</p>
        <p>&copy; ${new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

    // Plain text version for email clients that don't support HTML
    const textBody = `
${greeting}

Your CSV file "${fileName}" has been validated for project "${projectName}".

STATUS: ${results.isValid ? 'PASSED ✓' : 'FAILED ✗'}

Summary: ${results.summary}

Rows Checked: ${results.totalRows}
Errors: ${results.totalErrors}
Warnings: ${results.totalWarnings}

${results.isValid ? 'Your file is ready for import!' : 'Please fix the issues and re-upload your file.'}

---
This is an automated message from Temetra CSV Validator.
© ${new Date().getFullYear()} Vanzora, LLC. All rights reserved.
`;

    // Send the email
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: to,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send upload notification to admin
 *
 * @param adminEmail - Admin email address
 * @param uploaderName - Name of person who uploaded
 * @param uploaderEmail - Email of person who uploaded
 * @param fileName - Name of uploaded file
 * @param projectName - Name of the project
 * @param isValid - Whether the file passed validation
 */
export async function sendAdminNotificationEmail(
  adminEmail: string,
  uploaderName: string,
  uploaderEmail: string,
  fileName: string,
  projectName: string,
  isValid: boolean
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const subject = `[${projectName}] New CSV Upload - ${isValid ? 'Valid' : 'Has Errors'}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .alert-success { background: #dcfce7; border: 1px solid #bbf7d0; color: #166534; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .info { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h2>New File Upload Notification</h2>

    <div class="alert ${isValid ? 'alert-success' : 'alert-error'}">
      ${isValid ? '✅ File passed validation' : '❌ File has validation errors'}
    </div>

    <div class="info">
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>File:</strong> ${fileName}</p>
      <p><strong>Uploaded by:</strong> ${uploaderName} (${uploaderEmail})</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <p>Log in to the admin dashboard to view full details and download the file.</p>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: adminEmail,
      subject: subject,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return false;
  }
}

/**
 * Send template update notification to project admin
 *
 * @param adminEmail - Admin email address
 * @param projectName - Name of the affected project
 * @param templateName - Name of the updated template
 */
export async function sendTemplateUpdateEmail(
  adminEmail: string,
  projectName: string,
  templateName: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const subject = `[${projectName}] Validation Template Updated - ${templateName}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { padding: 15px; border-radius: 8px; margin-bottom: 15px; background: #dbeafe; border: 1px solid #93c5fd; color: #1e40af; }
    .info { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Validation Template Updated</h2>

    <div class="alert">
      The validation template <strong>${templateName}</strong> has been updated.
    </div>

    <div class="info">
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Template:</strong> ${templateName}</p>
      <p><strong>Updated at:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <p>The validation rules for your project have been automatically updated. Any new CSV uploads will be validated against the updated rules.</p>

    <p>Log in to the admin dashboard to review the changes.</p>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: adminEmail,
      subject: subject,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    console.error('Failed to send template update notification:', error);
    return false;
  }
}
