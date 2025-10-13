// app/api/change-password/route.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { logs: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password_hash: hashedPassword,
        password_last_changed: new Date(),
      },
    });

    await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "change_password",
          details: "Password changed successfully",
          success: true,
        },
      });

    return new Response(JSON.stringify({ message: "Password updated successfully" }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
