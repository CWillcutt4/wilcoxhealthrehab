import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const employee = await getCurrentEmployee();
  if (!employee) return NextResponse.redirect(new URL("/admin/login", req.url), 303);

  const form = await req.formData();
  const userId = String(form.get("userId") || "");
  const days = Math.max(1, Math.min(365, Number(form.get("days") || 0)));

  const m = await prisma.membership.findUnique({ where: { userId } });
  if (!m) return NextResponse.redirect(new URL("/admin", req.url), 303);

  const base = m.endDate && m.endDate > new Date() ? m.endDate : new Date();
  const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.membership.update({
    where: { userId },
    data: {
      endDate: newEnd,
      status: "active",
      graceUntil: null,
      keyDisabled: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: employee.id,
      actorType: "employee",
      action: "extend_membership",
      targetType: "user",
      targetId: userId,
      details: `+${days} days → ${newEnd.toISOString()}`,
    },
  });

  return NextResponse.redirect(new URL(`/admin/members/${userId}`, req.url), 303);
}
