import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyShopifyWebhook } from "@/lib/shopify";
import { getPlan } from "@/lib/plans";
import { issueViztinKey } from "@/lib/viztin";

/**
 * Shopify webhook entry point. Configure topics in Shopify:
 *   - orders/paid               → activates / renews membership, issues key
 *   - customers/subscriptions/cancelled → turns off recurring
 *   - refunds/create            → records a refund payment row
 *
 * Note: mapping from Shopify payload → internal user/membership is left as TODO
 * because the exact variant/line-item metadata depends on how the store is set up.
 * The email on the order is used to look up the user.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") || "";
  const topic = req.headers.get("x-shopify-topic") || "";

  const ok = verifyShopifyWebhook(rawBody, hmac);
  if (!ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  type ShopifyOrder = {
    email?: string;
    id?: number | string;
    total_price?: string;
    line_items?: Array<{ sku?: string; properties?: Array<{ name: string; value: string }> }>;
  };
  const payload = JSON.parse(rawBody) as ShopifyOrder;
  const email = (payload.email || "").toLowerCase();

  if (topic === "orders/paid" && email) {
    const user = await prisma.user.findUnique({ where: { email } });
    const membership = user ? await prisma.membership.findUnique({ where: { userId: user.id } }) : null;
    if (user && membership) {
      const plan = getPlan(membership.planCode);
      const now = new Date();
      const endDate = plan
        ? new Date(now.getTime() + plan.periodDays * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.payment.create({
          data: {
            userId: user.id,
            amountCents: Math.round(Number(payload.total_price || 0) * 100),
            status: "succeeded",
            description: `Shopify order ${payload.id}`,
            shopifyOrderId: String(payload.id || ""),
            paidAt: now,
          },
        }),
        prisma.membership.update({
          where: { userId: user.id },
          data: {
            status: "active",
            startDate: membership.startDate || now,
            endDate,
            graceUntil: null,
            keyIssued: true,
            keyIssuedAt: membership.keyIssuedAt || now,
            keyDisabled: false,
            shopifyOrderId: String(payload.id || ""),
          },
        }),
      ]);

      if (!membership.keyIssued) {
        await issueViztinKey({
          userId: user.id,
          userEmail: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          planLabel: membership.planLabel,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
