import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const employee = await getCurrentEmployee();
  if (!employee) return NextResponse.redirect(new URL("/admin/login", req.url), 303);

  const form = await req.formData();
  const userId = String(form.get("userId") || "");
  const note = String(form.get("note") || "").trim();
  if (!note) return NextResponse.redirect(new URL(`/admin/members/${userId}`, req.url), 303);

  await prisma.auditLog.create({
    data: {
      actorId: employee.id,
      actorType: "employee",
      action: "note",
      targetType: "user",
      targetId: userId,
      details: note,
    },
  });

  return NextResponse.redirect(new URL(`/admin/members/${userId}`, req.url), 303);
}
