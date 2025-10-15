import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";

const prisma = new PrismaClient();
const MAX_FAILED_LOGIN = 5;
const LOCK_DURATION_MINUTES = 15;

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
      console.log("🟦 Login attempt:", identifier);
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: { logs: true },
    });
   
    
    if (!user) {
      console.log("❌ User not found");
      return new Response("Invalid email or password", { status: 401 });
    }
  
    const now = new Date();
    if (user.is_locked && user.lock_expires_at && now < user.lock_expires_at) {
      return new Response("Account is locked. Try later.", { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log("❌ Wrong password for:", identifier);
      let failedCount = user.failed_login_count + 1;
      let lockExpiresAt = user.lock_expires_at;

      if (failedCount >= MAX_FAILED_LOGIN) {
        lockExpiresAt = new Date();
        lockExpiresAt.setMinutes(lockExpiresAt.getMinutes() + LOCK_DURATION_MINUTES);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_count: failedCount,
          is_locked: failedCount >= MAX_FAILED_LOGIN,
          lock_expires_at: lockExpiresAt,
        },
      });

      await prisma.auditLog.create({
        data: { userId: user.id, action: "wrong_password", success: false },

      });

      return new Response("Invalid email or password", { status: 401 });
    }
    
    console.log("✅ Password correct — generating OTP...");

    const otp = otpGenerator.generate(6, { 
      digits: true,
      upperCaseAlphabets: false, 
      specialChars: false, 
      lowerCaseAlphabets: false 
    });

    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    // ✅ Verify email config before creating transporter
    console.log("📧 Using email:", process.env.SMTP_SERVER_USERNAME);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
  });


    const subject = 'Your OTP Code';
    const text = `Your OTP code is: ${otp}. It will expire in 5 minutes.`;
    const html = `<p>Your OTP is: <strong>${otp}</strong></p>`;

    try {
      console.log("📤 Sending email...");
      await transporter.sendMail({
        from: process.env.SMTP_SERVER_USERNAME,
        to: user.email,
        subject,
        text,
        html,
      });

      console.log("✅ Email sent, saving OTP to DB...");

      await prisma.passwordResetOTP.create({
        data: {
          otp,
          email: user.email,
          created_at: now,
          expires_at,
        },
      });


      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "otp_pending",
          details: "OTP sent to email",
          success: true,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { failed_login_count: 0, is_locked: false, lock_expires_at: null },
      });

      console.log("✅ OTP saved successfully");
      return new Response("OTP sent to your email", { status: 200 });
    } catch (error: any) {
      console.error("🚨 Error sending OTP email:", error.message);
      return new Response("Error sending OTP email", { status: 500 });
    }

  } catch (err: any) {
    console.error("🚨 Server error in login route:", err.message);
    return new Response("Server error: " + err.message, { status: 500 });
  }
}
