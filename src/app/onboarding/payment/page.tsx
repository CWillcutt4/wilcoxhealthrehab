import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlan, formatDollars, totalPriceCents } from "@/lib/plans";
import { createCheckout } from "@/lib/shopify";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ sim?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { sim, error } = await searchParams;

  const membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  if (!membership) redirect("/onboarding/plan");
  if (membership.status === "active" || membership.status === "grace") redirect("/dashboard");

  const agreement = await prisma.waiver.findUnique({
    where: { userId_documentType: { userId: user.id, documentType: "membership_agreement" } },
  });
  if (!agreement) redirect("/onboarding/waiver");

  const guidelines = await prisma.waiver.findUnique({
    where: { userId_documentType: { userId: user.id, documentType: "guidelines" } },
  });
  if (!guidelines) redirect("/onboarding/guidelines");

  const plan = getPlan(membership.planCode);
  if (!plan) redirect("/onboarding/plan");

  const total = totalPriceCents(plan, membership.numKids);
  const checkout = await createCheckout({
    userId: user.id,
    userEmail: user.email,
    plan,
    numKids: membership.numKids,
    recurring: membership.recurring,
    totalCents: total,
  });

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <h1 className="text-2xl font-bold mb-1">Payment</h1>
        <p className="text-sm text-neutral-600 mb-8">Step 5 of 5 — Payment</p>

        {error && <p className="card bg-red-50 text-sm text-red-700 mb-6">{error}</p>}

        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Order summary</h2>
          <div className="flex justify-between text-sm py-1">
            <span>{plan.label}</span>
            <span>{formatDollars(plan.basePriceCents)}</span>
          </div>
          {membership.numKids > 0 && (
            <div className="flex justify-between text-sm py-1">
              <span>Kids add-on × {membership.numKids}</span>
              <span>{formatDollars(plan.kidAddOnCents * membership.numKids)}</span>
            </div>
          )}
          <div className="border-t border-neutral-200 mt-3 pt-3 flex justify-between font-bold">
            <span>Total today</span>
            <span>{formatDollars(total)}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            {membership.recurring
              ? `Recurring ${plan.billingCycle} billing enabled. Cancel anytime.`
              : "One-time payment. You'll need to manually renew."}
          </p>
        </div>

        {sim === "1" ? (
          <div className="card">
            <p className="text-sm mb-4">
              <b>Dev mode:</b> Shopify is not configured. Click below to simulate a successful payment.
            </p>
            <form action="/api/onboarding/simulate-payment" method="post">
              <button className="btn w-full" type="submit">
                Simulate successful payment
              </button>
            </form>
          </div>
        ) : (
          <div className="card">
            <p className="text-sm mb-4">You will be redirected to Shopify's secure checkout to complete your payment.</p>
            <a href={checkout.checkoutUrl} className="btn w-full text-center block">
              Continue to Shopify checkout
            </a>
          </div>
        )}
      </main>
    </>
  );
}
