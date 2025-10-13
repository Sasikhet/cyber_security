import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';

const prisma = new PrismaClient();
const MAX_FAILED_LOGIN = 5; // Lock after 5 failed attempts
const LOCK_DURATION_MINUTES = 15; // lock duration

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { logs: true },
    });

    if (!user) {
      return new Response("Invalid email or password", { status: 401 });
    }

    // Check if account is locked
    const now = new Date();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);
    if (user.is_locked && user.lock_expires_at && now < user.lock_expires_at) {
      return new Response("Account is locked. Try later.", { status: 403 });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      // Increment failed login count
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

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "login_failed",
          details: "Invalid password",
          success: false,
        },
      });

      return new Response("Invalid email or password", { status: 401 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.SMTP_SERVER_HOST,
      port: process.env.SMTP_SERVER_PORT ? parseInt(process.env.SMTP_SERVER_PORT) : 465,
      secure: true,
      auth: {
        user: process.env.SMTP_SERVER_USERNAME,
        pass: process.env.SMTP_SERVER_PASSWORD,
      },
    });

    const otp = otpGenerator.generate(6, { 
      digits: true,
      upperCaseAlphabets: false, 
      specialChars: false, 
      lowerCaseAlphabets: false 
    });

    const subject = 'Your OTP Code';
    const text = `Your OTP code is: ${otp}. It will expire in 5 minutes.`;
    const html = `<p>Your OTP is: <strong>${otp}</strong></p>`;

    try{
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject,
        text,
        html,
      });
      await prisma.passwordResetOTP.create({
        data: {
          otp: otp,
          email: user.email,
          created_at: now,
          expires_at: expires_at,
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

    //Reset failed login count
      await prisma.user.update({
        where: { id: user.id },
        data: { failed_login_count: 0, is_locked: false, lock_expires_at: null },
      });

      return new Response("OTP sent to your email", { status: 200 });
    } catch(error){
      console.error("Error sending OTP email:", error);
      return new Response("Error sending OTP email", { status: 500 });
    }

  } catch (err: any) {
    console.error(err);
    return new Response("Login error", { status: 500 });
  }
}
