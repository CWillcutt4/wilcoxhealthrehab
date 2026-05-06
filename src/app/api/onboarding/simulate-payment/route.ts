import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { issueViztinKey } from "@/lib/viztin";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  if (!membership) return NextResponse.redirect(new URL("/onboarding/plan", req.url), 303);

  const plan = getPlan(membership.planCode);
  if (!plan) return NextResponse.redirect(new URL("/onboarding/plan", req.url), 303);

  const now = new Date();
  const endDate = new Date(now.getTime() + plan.periodDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId: user.id,
        amountCents: membership.priceCents,
        status: "succeeded",
        description: `Initial payment — ${plan.label}`,
        paidAt: now,
      },
    }),
    prisma.membership.update({
      where: { userId: user.id },
      data: {
        status: "active",
        startDate: now,
        endDate,
        graceUntil: null,
        keyIssued: true,
        keyIssuedAt: now,
      },
    }),
  ]);

  await issueViztinKey({
    userId: user.id,
    userEmail: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    planLabel: plan.label,
  });

  return NextResponse.redirect(new URL("/onboarding/complete", req.url), 303);
}
