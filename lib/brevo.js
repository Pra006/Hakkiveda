import nodemailer from "nodemailer";

export async function sendOtpEmail({ to, otp, purpose }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("[BREVO] BREVO_API_KEY is not configured");
    return { success: false, error: "Email service not configured." };
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@hakkiveda.com";
  const senderName = process.env.BREVO_SENDER_NAME || "Hakkiveda";

  const purposeLabel =
    purpose === "B2B_REGISTRATION"
      ? "B2B Business Registration"
      : "Account Registration";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f3ef;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e5e0;">
    <tr>
      <td style="background:#1a3a2a;padding:24px 32px;text-align:center;">
        <span style="font-size:22px;font-weight:700;color:#c9a96e;letter-spacing:0.5px;">Hakkiveda</span>
        <br/>
        <span style="font-size:9px;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;">Nepal Marketplace</span>
      </td>
    </tr>
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
  </table>
</body>
</html>`.trim();

  try {
    const smtpLogin = process.env.BREVO_SMTP_LOGIN || senderEmail;

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpLogin,
        pass: apiKey,
      },
    });

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject: `${otp} is your Hakkiveda verification code`,
      html: htmlContent,
    });

    return { success: true };
  } catch (err) {
    console.error("[BREVO] Send error:", err.message);
    return { success: false, error: "Failed to send verification email." };
  }
}
