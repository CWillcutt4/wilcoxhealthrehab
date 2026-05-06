import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDollars } from "@/lib/plans";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    grace: "bg-yellow-100 text-yellow-800",
    disabled: "bg-red-100 text-red-800",
    expired: "bg-neutral-200 text-neutral-700",
    cancelled: "bg-neutral-200 text-neutral-700",
    pending: "bg-blue-100 text-blue-800",
  };
  const cls = map[status] || "bg-neutral-200 text-neutral-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${cls}`}>
      {status}
    </span>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  if (!membership || membership.status === "pending") redirect("/onboarding/plan");

  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const waiver = await prisma.waiver.findFirst({
    where: { userId: user.id },
    orderBy: { signedAt: "desc" },
  });

  const fmtDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : "—";

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-sm text-neutral-600 mb-8">{user.email}</p>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Membership</h2>
            {statusBadge(membership.status)}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-neutral-500">Plan</div>
              <div className="font-medium">{membership.planLabel}</div>
            </div>
            <div>
              <div className="text-neutral-500">Price</div>
              <div className="font-medium">
                {formatDollars(membership.priceCents)} / {membership.billingCycle}
              </div>
            </div>
            <div>
              <div className="text-neutral-500">Kids on plan</div>
              <div className="font-medium">{membership.numKids}</div>
            </div>
            <div>
              <div className="text-neutral-500">Auto-renew</div>
              <div className="font-medium">{membership.recurring ? "On" : "Off"}</div>
            </div>
            <div>
              <div className="text-neutral-500">
                {membership.status === "grace" ? "Grace expires" : "Next billing / expires"}
              </div>
              <div className="font-medium">
                {membership.status === "grace"
                  ? fmtDate(membership.graceUntil)
                  : fmtDate(membership.endDate)}
              </div>
            </div>
            <div>
              <div className="text-neutral-500">Viztin key</div>
              <div className="font-medium">
                {membership.keyDisabled
                  ? "Disabled"
                  : membership.keyIssued
                  ? "Active"
                  : "Pending"}
              </div>
            </div>
          </div>

          {membership.status === "grace" && (
            <p className="mt-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
              Your payment is overdue. Please renew by{" "}
              <b>{fmtDate(membership.graceUntil)}</b> or your key will be disabled.
            </p>
          )}
          {membership.status === "disabled" && (
            <p className="mt-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded p-3">
              Your membership is disabled. Renew below to reactivate your key.
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-6">
            {(membership.status === "expired" ||
              membership.status === "disabled" ||
              membership.status === "grace") && (
              <form action="/api/membership/renew" method="post">
                <button className="btn" type="submit">Renew membership</button>
              </form>
            )}
            {membership.recurring && membership.status === "active" && (
              <form action="/api/membership/cancel" method="post">
                <button className="btn-outline" type="submit">
                  Cancel auto-renew
                </button>
              </form>
            )}
            <Link href="/dashboard/payment-method" className="btn-outline">
              Update payment method
            </Link>
            {waiver && (
              <a href={`/api/waiver/download`} className="btn-outline">
                Download signed waiver
              </a>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-lg mb-3">Recent payments</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-neutral-600">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-100">
                    <td className="py-2">{fmtDate(p.paidAt || p.createdAt)}</td>
                    <td className="py-2">{p.description || "—"}</td>
                    <td className="py-2">{formatDollars(p.amountCents)}</td>
                    <td className="py-2">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
