import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();
    console.log("Change password request for:", email,newPassword);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!regex.test(newPassword)) {
      return new Response(JSON.stringify({ message: "Password not strong enough" }), {status: 401});
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password_hash: hashed, password_last_changed: new Date() },
    });

    await prisma.passwordResetOTP.deleteMany({ where: { email } });

    await prisma.auditLog.create({
            data: {
            userId: user.id,
            action: "password_change_success",
            details:"password changed successfully",
            success: true,
            },
    });

    return new Response(JSON.stringify({ message: "Password changed successfully" }), {status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });

  }
}
