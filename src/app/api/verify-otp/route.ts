import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function POST(req: Request) {
  try {
    const { identifier, otp } = await req.json();

    // 1️⃣ Find the OTP record (by email only, since OTPs are tied to email)
    const otpRecord = await prisma.passwordResetOTP.findFirst({
      where: { email: identifier, otp },
      orderBy: { created_at: "desc" },
    });

    // If not found by email, try to resolve identifier → email from username
    let email = identifier;
    if (!otpRecord) {
      const userByUsername = await prisma.user.findUnique({
        where: { username: identifier },
      });
      if (userByUsername) email = userByUsername.email;
    }

    const record = await prisma.passwordResetOTP.findFirst({
      where: { email, otp },
      orderBy: { created_at: "desc" },
    });

    // 2️⃣ Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: identifier }],
      },
      include: { roles: { include: { role: true } } },
    });
    

    if (!user)
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });

    if (!record || record.otp !== otp) {
      await prisma.auditLog.create({
              data: {
              userId: user.id,
              action: "login_failed",
              details:"OTP Invalid",
              success: false,
              },
          });

      return new Response(
        JSON.stringify({ message: "OTP Invalid" }),
        { status: 404 }
      );
    }

    if (new Date() > record.expires_at) {
      await prisma.auditLog.create({
              data: {
              userId: user.id,
              action: "login_failed",
              details:"OTP expired",
              success: false,
              },
          });

      return new Response(
        JSON.stringify({ message: "OTP expired" }),
        { status: 400 }
      );
    }

    // 3️⃣ Generate JWT token
    const role = user.roles[0]?.role?.name || "user";

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role ,password_last_changed:user.password_last_changed},
      JWT_SECRET,
      { expiresIn: "1h" }
    );

  
    await prisma.auditLog.create({
            data: {
            userId: user.id,
            action: "login_success",
            details:"OTP verified",
            success: true,
            },
        });

    // 4️⃣ Delete used OTPs for that email
    await prisma.passwordResetOTP.deleteMany({ where: { email } });

    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (err: any) {
    console.error(err);
    return new Response(
      JSON.stringify({ message: "Server error", error: err.message }),
      { status: 500 }
    );

  }
}
