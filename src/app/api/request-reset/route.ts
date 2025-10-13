import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Check if the email exists in the user table
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response("No account found with that email.", { status: 404 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expires in 10 minutes
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in database
    await prisma.passwordResetOTP.create({
      data: {
        email,
        otp,
        expires_at,
      },
    });

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // e.g. your Gmail address
        pass: process.env.EMAIL_PASS, // app-specific password
      },
    });

    // Send the OTP via email
    await transporter.sendMail({
      from: `"Security System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your OTP is <b>${otp}</b>.</p><p>This code expires in 10 minutes.</p>`,
    });

    return new Response(JSON.stringify({ message: "OTP sent successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return new Response("Failed to send OTP", { status: 500 });
  }
}
