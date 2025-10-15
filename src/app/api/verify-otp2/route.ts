import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    
    const record = await prisma.passwordResetOTP.findFirst({
      where: { email, otp },
      orderBy: { created_at: "desc" },
    });
    
    if (!record || new Date() > record.expires_at) {
      return new Response(JSON.stringify({ message: "Invalid or expired OTP" }), { status: 400 });
    }
    

    return new Response(JSON.stringify({ message: "OTP verified" }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}
