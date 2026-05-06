import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createUserSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const firstName = String(form.get("firstName") || "").trim();
  const lastName = String(form.get("lastName") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const phone = String(form.get("phone") || "").trim() || null;
  const password = String(form.get("password") || "");

  if (!firstName || !lastName || !email || password.length < 8) {
    return NextResponse.redirect(new URL("/signup?error=Missing+fields", req.url), 303);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Account already exists — please log in"), req.url),
      303,
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { firstName, lastName, email, phone, passwordHash },
  });

  await createUserSession(user.id);
  return NextResponse.redirect(new URL("/onboarding/plan", req.url), 303);
}
