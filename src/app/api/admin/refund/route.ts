import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentEmployee } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const employee = await getCurrentEmployee();
  if (!employee) return NextResponse.redirect(new URL("/admin/login", req.url), 303);
  if (employee.role !== "owner") {
    return NextResponse.redirect(new URL("/admin", req.url), 303);
  }

  const form = await req.formData();
  const userId = String(form.get("userId") || "");
  const amountCents = Math.max(1, Number(form.get("amountCents") || 0));

  await prisma.payment.create({
    data: {
      userId,
      amountCents: -amountCents,
      status: "refunded",
      description: `Refund recorded by ${employee.name}`,
      paidAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: employee.id,
      actorType: "employee",
      action: "refund",
      targetType: "user",
      targetId: userId,
      details: `-${amountCents}¢`,
    },
  });

  return NextResponse.redirect(new URL(`/admin/members/${userId}`, req.url), 303);
}
