import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0; font-family: Georgia, serif;">SEZ Profile Security</h1>
      </div>
      <div style="padding: 40px 20px; background-color: #ffffff; text-align: center;">
        <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          You requested to update your profile credentials. Use the code below to verify your identity.
        </p>
        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; margin: 30px 0; display: inline-block;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a1a1a;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 14px; margin-bottom: 0;">
          This code will expire in 10 minutes.<br>If you did not request this, please ignore this email.
        </p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; color: #999; font-size: 12px;">
        &copy; ${new Date().getFullYear()} SEZ. All rights reserved.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"SEZ Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Verification Code - SEZ",
    html,
  });
}
