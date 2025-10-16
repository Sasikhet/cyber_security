import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // Password complexity check
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!regex.test(password)) {
      return new Response("Password not strong enough", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
      },
    });

    return new Response(JSON.stringify({ message: "User registered", user }), { status: 201 });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);  // 🔍 Log full error
    return new Response("Error registering user: " + err.message, { status: 500 });
  }
}

