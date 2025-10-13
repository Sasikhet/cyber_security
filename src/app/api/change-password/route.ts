// app/api/change-password/route.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password_hash: hashedPassword,
        password_last_changed: new Date(),
      },
    });

    return new Response(JSON.stringify({ message: "Password updated successfully" }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
