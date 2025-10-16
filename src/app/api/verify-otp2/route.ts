import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }
    
    const record = await prisma.passwordResetOTP.findFirst({
      where: { email, otp },
      orderBy: { created_at: "desc" },
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

      return new Response(JSON.stringify({ message: "OTP Invalid" }), { status: 404 });
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

      return new Response(JSON.stringify({ message: "OTP expired" }), { status: 400 }
      );
    }
    
    await prisma.auditLog.create({
            data: {
            userId: user.id,
            action: "login_success",
            details:"OTP verified",
            success: true,
            },
    });
    return new Response(JSON.stringify({ message: "OTP verified" }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}
