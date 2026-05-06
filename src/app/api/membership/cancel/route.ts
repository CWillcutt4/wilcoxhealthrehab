import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail, stripHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  if (!membership) return NextResponse.redirect(new URL("/dashboard", req.url), 303);

  await prisma.membership.update({
    where: { userId: user.id },
    data: { recurring: false },
  });

  const html = `
    <p>Hi ${user.firstName},</p>
    <p>Auto-renew has been turned off for your Wilcox Health and Rehab Center membership.</p>
    <p>Your access remains active through <b>${
      membership.endDate ? new Date(membership.endDate).toLocaleDateString() : "your current period"
    }</b>. After that, you'll need to manually renew to continue using the gym.</p>
    <p>Changed your mind? You can re-enable auto-renew from your dashboard anytime.</p>
  `;
  await sendEmail({
    to: user.email,
    subject: "Auto-renew turned off — Wilcox Health and Rehab Center",
    html,
    text: stripHtml(html),
  });

  return NextResponse.redirect(new URL("/dashboard", req.url), 303);
}
