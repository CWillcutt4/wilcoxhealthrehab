import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentEmployee } from "@/lib/auth";
import { issueViztinKey, revokeViztinKey } from "@/lib/viztin";

export async function POST(req: NextRequest) {
  const employee = await getCurrentEmployee();
  if (!employee) return NextResponse.redirect(new URL("/admin/login", req.url), 303);

  const form = await req.formData();
  const userId = String(form.get("userId") || "");

  const membership = await prisma.membership.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!membership) return NextResponse.redirect(new URL("/admin", req.url), 303);

  const nowDisabled = !membership.keyDisabled;
  await prisma.membership.update({
    where: { userId },
    data: { keyDisabled: nowDisabled },
  });

  if (nowDisabled) {
    await revokeViztinKey(membership.keyReference);
  } else {
    await issueViztinKey({
      userId: membership.user.id,
      userEmail: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      planLabel: membership.planLabel,
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: employee.id,
      actorType: "employee",
      action: nowDisabled ? "key_disable" : "key_enable",
      targetType: "user",
      targetId: userId,
    },
  });

  return NextResponse.redirect(new URL(`/admin/members/${userId}`, req.url), 303);
}
