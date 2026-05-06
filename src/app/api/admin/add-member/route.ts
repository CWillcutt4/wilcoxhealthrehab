import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentEmployee, hashPassword } from "@/lib/auth";
import { getPlan, totalPriceCents } from "@/lib/plans";
import { issueViztinKey } from "@/lib/viztin";

export async function POST(req: NextRequest) {
  const employee = await getCurrentEmployee();
  if (!employee) return NextResponse.redirect(new URL("/admin/login", req.url), 303);

  const form = await req.formData();
  const firstName = String(form.get("firstName") || "").trim();
  const lastName = String(form.get("lastName") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const phone = String(form.get("phone") || "").trim() || null;
  const password = String(form.get("password") || "");
  const planCode = String(form.get("planCode") || "");
  const numKidsRaw = Number(form.get("numKids") || 0);
  const markPaid = form.get("paid") === "1";

  if (!firstName || !lastName || !email || password.length < 8) {
    return NextResponse.redirect(
      new URL("/admin/add?error=" + encodeURIComponent("Missing required fields"), req.url),
      303,
    );
  }

  const plan = getPlan(planCode);
  if (!plan) {
    return NextResponse.redirect(
      new URL("/admin/add?error=" + encodeURIComponent("Invalid plan"), req.url),
      303,
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.redirect(
      new URL("/admin/add?error=" + encodeURIComponent("Email already in use"), req.url),
      303,
    );
  }

  const numKids = plan.kidAddOnCents > 0 ? Math.max(0, Math.min(10, Math.floor(numKidsRaw))) : 0;
  const price = totalPriceCents(plan, numKids);
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      passwordHash: await hashPassword(password),
    },
  });

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      planCode: plan.code,
      planLabel: plan.label,
      membershipType: plan.membershipType,
      numKids,
      billingCycle: plan.billingCycle,
      priceCents: price,
      recurring: false,
      status: markPaid ? "active" : "pending",
      startDate: markPaid ? now : null,
      endDate: markPaid ? new Date(now.getTime() + plan.periodDays * 24 * 60 * 60 * 1000) : null,
      keyIssued: markPaid,
      keyIssuedAt: markPaid ? now : null,
    },
  });

  if (markPaid) {
    await prisma.payment.create({
      data: {
        userId: user.id,
        amountCents: price,
        status: "succeeded",
        description: `Manual payment (in-person) — recorded by ${employee.name}`,
        paidAt: now,
      },
    });
    await issueViztinKey({
      userId: user.id,
      userEmail: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      planLabel: plan.label,
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: employee.id,
      actorType: "employee",
      action: "manual_add_member",
      targetType: "user",
      targetId: user.id,
      details: `${plan.code} paid=${markPaid}`,
    },
  });

  return NextResponse.redirect(new URL(`/admin/members/${user.id}`, req.url), 303);
}
