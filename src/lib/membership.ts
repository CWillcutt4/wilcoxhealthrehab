import { prisma } from "./db";
import { revokeViztinKey } from "./viztin";
import { sendEmail } from "./email";

/**
 * Runs the key-disable state machine for all memberships.
 * Call from a cron endpoint (e.g. every hour in production).
 *
 *   active  -> (endDate passed)    -> grace  + send "pay within 24h" email
 *   grace   -> (graceUntil passed) -> disabled + revoke Viztin key
 */
export async function runMembershipSweep(): Promise<{ toGrace: number; toDisabled: number }> {
  const now = new Date();
  let toGrace = 0;
  let toDisabled = 0;

  // Step 1: active memberships whose endDate has passed → move to grace
  const expiring = await prisma.membership.findMany({
    where: { status: "active", endDate: { lt: now } },
    include: { user: true },
  });

  for (const m of expiring) {
    const graceUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await prisma.membership.update({
      where: { id: m.id },
      data: { status: "grace", graceUntil },
    });
    toGrace++;

    await sendEmail({
      to: m.user.email,
      subject: "Wilcox Health and Rehab — payment overdue, 24-hour grace period",
      html: `
        <p>Hi ${m.user.firstName},</p>
        <p>Your Wilcox Health and Rehab Center membership payment is past due. You have a
           <b>24-hour grace period</b> (until ${graceUntil.toLocaleString()}) to
           renew before your electronic key is disabled.</p>
        <p><a href="${baseUrl()}/dashboard">Log in and renew</a></p>
        <p>— Wilcox Health and Rehab Center</p>
      `,
    });
  }

  // Step 2: grace memberships whose graceUntil has passed → disable key
  const lapsed = await prisma.membership.findMany({
    where: { status: "grace", graceUntil: { lt: now } },
    include: { user: true },
  });

  for (const m of lapsed) {
    await revokeViztinKey(m.keyReference);
    await prisma.membership.update({
      where: { id: m.id },
      data: { status: "disabled", keyDisabled: true },
    });
    toDisabled++;

    await sendEmail({
      to: m.user.email,
      subject: "Wilcox Health and Rehab — your key has been disabled",
      html: `
        <p>Hi ${m.user.firstName},</p>
        <p>Your grace period has ended and your electronic key has been disabled.
           To regain access, log in and renew your membership.</p>
        <p><a href="${baseUrl()}/dashboard">Log in and renew</a></p>
      `,
    });
  }

  return { toGrace, toDisabled };
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
