import nodemailer from "nodemailer";

function createTransporter() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;

  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@hakkiveda.com";
  const smtpLogin = process.env.BREVO_SMTP_LOGIN || senderEmail;

  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: { user: smtpLogin, pass: apiKey },
  });
}

function getSender() {
  return {
    email: process.env.BREVO_SENDER_EMAIL || "noreply@hakkiveda.com",
    name: process.env.BREVO_SENDER_NAME || "Hakkiveda",
  };
}

const EMAIL_HEADER = `
    <tr>
      <td style="background:#1a3a2a;padding:24px 32px;text-align:center;">
        <span style="font-size:22px;font-weight:700;color:#c9a96e;letter-spacing:0.5px;">Hakkiveda</span>
        <br/>
        <span style="font-size:9px;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;">Nepal Marketplace</span>
      </td>
    </tr>`;

const EMAIL_WRAPPER_START = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f3ef;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e5e0;">`;

const EMAIL_WRAPPER_END = `  </table>
</body>
</html>`;

export async function sendOtpEmail({ to, otp, purpose }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.error("[BREVO] BREVO_API_KEY is not configured");
    return { success: false, error: "Email service not configured." };
  }

  const sender = getSender();
  const purposeLabel =
    purpose === "B2B_REGISTRATION"
      ? "B2B Business Registration"
      : "Account Registration";

  const html = `${EMAIL_WRAPPER_START}
${EMAIL_HEADER}
    <tr>
      <td style="padding:40px 32px 32px;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#1a3a2a;font-weight:700;">Verify Your Email</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
          Use the code below to complete your ${purposeLabel} on Hakkiveda.
        </p>
        <div style="background:#f5f3ef;border:2px dashed #c9a96e;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1a3a2a;font-family:monospace;">${otp}</span>
        </div>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
          This code expires in <strong>5 minutes</strong>.
        </p>
        <p style="margin:0;font-size:13px;color:#6b7280;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 24px;border-top:1px solid #e8e5e0;">
        <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
          Do not share this code with anyone. Hakkiveda will never ask for your verification code.
        </p>
      </td>
    </tr>
${EMAIL_WRAPPER_END}`;

  try {
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to,
      subject: `${otp} is your Hakkiveda verification code`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("[BREVO] Send error:", err.message);
    return { success: false, error: "Failed to send verification email." };
  }
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.error("[BREVO] BREVO_API_KEY is not configured");
    return { success: false, error: "Email service not configured." };
  }

  const sender = getSender();

  const html = `${EMAIL_WRAPPER_START}
${EMAIL_HEADER}
    <tr>
      <td style="padding:40px 32px 32px;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#1a3a2a;font-weight:700;">Reset Your Password</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
          We received a request to reset your password. Click the button below to choose a new password.
        </p>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${resetUrl}" style="display:inline-block;background:#1a3a2a;color:#c9a96e;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;border:1px solid #c9a96e40;">
            Reset Password
          </a>
        </div>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
          This link expires in <strong>30 minutes</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">
          If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
        <p style="margin:0;font-size:11px;color:#9ca3af;word-break:break-all;">
          If the button does not work, copy and paste this link into your browser:<br/>
          <a href="${resetUrl}" style="color:#1a3a2a;">${resetUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 24px;border-top:1px solid #e8e5e0;">
        <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
          Do not share this link with anyone. Hakkiveda will never ask for your password.
        </p>
      </td>
    </tr>
${EMAIL_WRAPPER_END}`;

  try {
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to,
      subject: "Reset your Hakkiveda password",
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("[BREVO] Password reset send error:", err.message);
    return { success: false, error: "Failed to send password reset email." };
  }
}
