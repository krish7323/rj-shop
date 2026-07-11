// utils/sendEmail.js
const nodemailer = require("nodemailer");

/**
 * Send an OTP code to a recipient email.
 * If SMTP environment variables are missing, logs to the console for development.
 */
const sendOTP = async (email, otp) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log(`\n📨 [DEV FALLBACK] Verification OTP for ${email} is: ${otp}\n`);
    return true;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: Number(port) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: `"RJ Mobile Store" <${user}>`,
    to: email,
    subject: "Verify Your RJ Mobile Store Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 12px; backgroundColor: #ffffff;">
        <h2 style="color: #0f172a; text-align: center;">RJ Mobile Store Verification</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Thank you for registering at RJ Mobile Store. Please use the following one-time password (OTP) to verify your account and complete your sign-in. This code is valid for 15 minutes.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0284c7; padding: 12px 24px; border: 2px dashed #bae6fd; border-radius: 8px; background-color: #f0f9ff; display: inline-block;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          If you did not request this verification, please ignore this email.
          <br />📍 Nehra, Darbhanga, Bihar - 847239
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
};

module.exports = { sendOTP };
