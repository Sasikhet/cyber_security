// app/api/verify-otp/route.ts
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    const record = await prisma.passwordResetOTP.findFirst({
      where: {
        email,
        otp,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    if (!record) {
      return new Response(JSON.stringify({ error: "Invalid or expired OTP" }), { status: 400 });
    }

    return new Response(JSON.stringify({ message: "OTP verified successfully" }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
