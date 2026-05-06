import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createUserSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Invalid email or password"), req.url),
      303,
    );
  }

  await createUserSession(user.id);
  return NextResponse.redirect(new URL("/dashboard", req.url), 303);
}
