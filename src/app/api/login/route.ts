import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const MAX_FAILED_LOGIN = 5; // Lock after 5 failed attempts
const LOCK_DURATION_MINUTES = 15; // lock duration

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { logs: true },
    });

    if (!user) {
      return new Response("Invalid email or password", { status: 401 });
    }

    // Check if account is locked
    const now = new Date();
    if (user.is_locked && user.lock_expires_at && now < user.lock_expires_at) {
      return new Response("Account is locked. Try later.", { status: 403 });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      // Increment failed login count
      let failedCount = user.failed_login_count + 1;
      let lockExpiresAt = user.lock_expires_at;

      if (failedCount >= MAX_FAILED_LOGIN) {
        lockExpiresAt = new Date();
        lockExpiresAt.setMinutes(lockExpiresAt.getMinutes() + LOCK_DURATION_MINUTES);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_count: failedCount,
          is_locked: failedCount >= MAX_FAILED_LOGIN,
          lock_expires_at: lockExpiresAt,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "login_failed",
          success: false,
        },
      });

      return new Response("Invalid email or password", { status: 401 });
    }

    // Reset failed login count
    await prisma.user.update({
      where: { id: user.id },
      data: { failed_login_count: 0, is_locked: false, lock_expires_at: null },
    });

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "login_success",
        success: true,
      },
    });

    return new Response(JSON.stringify({ message: "Login success", token }), { status: 200 });
  } catch (err: any) {
    console.error(err);
    return new Response("Login error", { status: 500 });
  }
}
