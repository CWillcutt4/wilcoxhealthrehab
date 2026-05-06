import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  if (!membership) return NextResponse.redirect(new URL("/onboarding/plan", req.url), 303);

  await prisma.membership.update({
    where: { userId: user.id },
    data: { status: "pending" },
  });

  return NextResponse.redirect(new URL("/onboarding/payment", req.url), 303);
}
