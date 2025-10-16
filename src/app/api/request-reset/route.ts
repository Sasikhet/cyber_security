import { PrismaClient } from "@prisma/client";
import { randomInt } from "crypto";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ message: "Email not found" }), { status: 404 });
    }

    const otp = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.SMTP_SERVER_USERNAME,
            pass: process.env.SMTP_SERVER_PASSWORD,
          },
      });

    try {
      console.log("Sending email...");
      await transporter.sendMail({
        from: process.env.SMTP_SERVER_USERNAME,
        to: user.email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
        html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
      });

      console.log("Email sent, saving OTP to DB...");

       await prisma.passwordResetOTP.create({
      data: { email, otp, expires_at: expiresAt },
     });

    console.log(`OTP for ${email}: ${otp}`);
      console.log("OTP saved successfully");
      return new Response("OTP sent to your email", { status: 200 });
    } catch (error: any) {
      console.error("Error sending OTP email:", error.message);
      return new Response("Error sending OTP email", { status: 500 });

    }

   
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}
