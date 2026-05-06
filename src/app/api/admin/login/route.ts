import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createEmployeeSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee || !(await verifyPassword(password, employee.passwordHash))) {
    return NextResponse.redirect(
      new URL("/admin/login?error=" + encodeURIComponent("Invalid credentials"), req.url),
      303,
    );
  }

  await createEmployeeSession(employee.id);
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}
