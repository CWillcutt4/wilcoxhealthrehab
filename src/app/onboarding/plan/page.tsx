import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { listPlans, formatDollars, totalPriceCents } from "@/lib/plans";
import { prisma } from "@/lib/db";

export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // If they already have an active membership, send them to dashboard.
  const m = await prisma.membership.findUnique({ where: { userId: user.id } });
  if (m && (m.status === "active" || m.status === "grace")) redirect("/dashboard");

  const plans = listPlans();

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <h1 className="text-2xl font-bold mb-1">Pick your plan</h1>
        <p className="text-sm text-neutral-600 mb-8">Step 2 of 5 — Membership</p>

        <form action="/api/onboarding/plan" method="post" className="space-y-4">
          <div className="space-y-3">
            {plans.map((p) => {
              const sampleTotal = totalPriceCents(p, 0);
              return (
                <label
                  key={p.code}
                  className="card flex items-start gap-4 cursor-pointer hover:border-black transition"
                >
                  <input
                    type="radio"
                    name="planCode"
                    value={p.code}
                    required
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline gap-4">
                      <h3 className="font-semibold">{p.label}</h3>
                      <div className="font-bold whitespace-nowrap">
                        {formatDollars(sampleTotal)}
                        <span className="text-xs font-normal text-neutral-500">
                          {" "}
                          /{" "}
                          {p.billingCycle === "weekly"
                            ? "wk"
                            : p.billingCycle === "monthly"
                            ? "mo"
                            : "yr"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{p.description}</p>
                    {p.commitmentDays > 0 && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Requires a {p.commitmentDays}-day commitment.
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="card">
            <label className="label" htmlFor="numKids">Number of kids to add (if applicable)</label>
            <input
              type="number"
              id="numKids"
              name="numKids"
              min={0}
              max={10}
              defaultValue={0}
              className="input max-w-[120px]"
            />
            <p className="text-xs text-neutral-500 mt-2">
              Kids add-on: $15/mo (monthly plans) or $12/mo (1-year contract). Not available on weekly or paid-up-front yearly plans.
            </p>
          </div>

          <div className="card">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="recurring" defaultChecked value="1" />
              <span className="text-sm">
                <b>Enable automatic recurring billing</b> (recommended — your key stays active without manual renewal)
              </span>
            </label>
            <p className="text-xs text-neutral-500 mt-2 ml-7">
              If you turn this off, you'll need to manually pay each billing period or your key will be disabled 24 hours after expiration.
            </p>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn">Continue to Membership Agreement</button>
          </div>
        </form>
      </main>
    </>
  );
}
