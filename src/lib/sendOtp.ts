// lib/sendOtp.ts
import nodemailer from "nodemailer";

export async function sendOtpByEmail(receiverEmail: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nakrobpanejohn@gmail.com",
      pass: "xkgd alam gjvj gwzc", // ⚠️ Use an App Password, not your real Gmail password!
    },
  });

  await transporter.sendMail({
    from: '"Your App" <nakrobpanejohn@gmail.com>',
    to: receiverEmail,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}\nIt expires in 10 minutes.`,
  });
}
