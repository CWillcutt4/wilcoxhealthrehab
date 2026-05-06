import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlan, totalPriceCents } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const form = await req.formData();
  const planCode = String(form.get("planCode") || "");
  const numKidsRaw = Number(form.get("numKids") || 0);
  const recurring = form.get("recurring") === "1";

  const plan = getPlan(planCode);
  if (!plan) {
    return NextResponse.redirect(new URL("/onboarding/plan?error=invalid", req.url), 303);
  }

  // Kids add-on only on monthly plans (weekly & paid-upfront yearly disallow).
  const kidsAllowed = plan.kidAddOnCents > 0;
  const numKids = kidsAllowed ? Math.max(0, Math.min(10, Math.floor(numKidsRaw))) : 0;

  const price = totalPriceCents(plan, numKids);

  await prisma.membership.upsert({
    where: { userId: user.id },
    update: {
      planCode: plan.code,
      planLabel: plan.label,
      membershipType: plan.membershipType,
      numKids,
      billingCycle: plan.billingCycle,
      priceCents: price,
      recurring: plan.recurringByDefault ? recurring : false,
      status: "pending",
    },
    create: {
      userId: user.id,
      planCode: plan.code,
      planLabel: plan.label,
      membershipType: plan.membershipType,
      numKids,
      billingCycle: plan.billingCycle,
      priceCents: price,
      recurring: plan.recurringByDefault ? recurring : false,
      status: "pending",
    },
  });

  return NextResponse.redirect(new URL("/onboarding/waiver", req.url), 303);
}
