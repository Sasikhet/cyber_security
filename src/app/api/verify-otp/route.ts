// app/api/verify-otp/route.ts
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { logs: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const record = await prisma.passwordResetOTP.findFirst({
      where: {
        email,
        otp,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    if (!record) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "login_failed",
          details: "Invalid or expired OTP",
          success: false,
        },
      });

      return new Response(JSON.stringify({ error: "Invalid or expired OTP" }), { status: 400 });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "login_success",
        details: "OTP verified successfully",
        success: true,
      },
    });

    return new Response(JSON.stringify({ message: "OTP verified successfully" }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
