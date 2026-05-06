import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";
import { getCurrentEmployee } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDollars } from "@/lib/plans";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/admin/login");
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      membership: true,
      waivers: { orderBy: { signedAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 25 },
    },
  });
  if (!user) notFound();

  const fmtDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleString() : "—";

  const isOwner = employee.role === "owner";

  return (
    <>
      <AdminHeader />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
        <Link href="/admin" className="text-sm underline">← Back to members</Link>
        <h1 className="text-2xl font-bold mt-3 mb-1">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          {user.email}{user.phone ? ` · ${user.phone}` : ""} · joined {fmtDate(user.createdAt)}
        </p>

        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Membership</h2>
          {user.membership ? (
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><b>Plan:</b> {user.membership.planLabel}</div>
              <div><b>Status:</b> {user.membership.status}</div>
              <div><b>Price:</b> {formatDollars(user.membership.priceCents)} / {user.membership.billingCycle}</div>
              <div><b>Auto-renew:</b> {user.membership.recurring ? "On" : "Off"}</div>
              <div><b>Kids:</b> {user.membership.numKids}</div>
              <div><b>Started:</b> {fmtDate(user.membership.startDate)}</div>
              <div><b>Ends:</b> {fmtDate(user.membership.endDate)}</div>
              <div><b>Grace until:</b> {fmtDate(user.membership.graceUntil)}</div>
              <div><b>Key issued:</b> {user.membership.keyIssued ? "Yes" : "No"}</div>
              <div><b>Key disabled:</b> {user.membership.keyDisabled ? "Yes" : "No"}</div>
            </div>
          ) : (
            <p className="text-sm text-neutral-600">No membership record.</p>
          )}

          {user.membership && (
            <div className="flex flex-wrap gap-2 mt-4">
              <form action="/api/admin/toggle-key" method="post">
                <input type="hidden" name="userId" value={user.id} />
                <button className="btn-outline" type="submit">
                  {user.membership.keyDisabled ? "Enable key" : "Disable key"}
                </button>
              </form>
              <form action="/api/admin/extend" method="post">
                <input type="hidden" name="userId" value={user.id} />
                <input type="number" name="days" min={1} max={365} defaultValue={30} className="input max-w-[90px] inline-block" />
                <button className="btn-outline ml-2" type="submit">Extend (days)</button>
              </form>
              {isOwner && (
                <form action="/api/admin/refund" method="post" className="inline">
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="number" name="amountCents" min={1} placeholder="Amount (cents)" className="input max-w-[160px] inline-block" />
                  <button className="btn-outline ml-2" type="submit">Record refund</button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Signed documents</h2>
          {user.waivers.length === 0 ? (
            <p className="text-sm text-neutral-600">No signed documents on file.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {user.waivers.map((w) => {
                const label =
                  w.documentType === "membership_agreement"
                    ? "Membership Agreement & Liability Waiver"
                    : "Member Guidelines / Rules";
                return (
                  <li key={w.id} className="flex justify-between items-center gap-4">
                    <span>
                      <b>{label}</b> — signed by {w.signedName} on {fmtDate(w.signedAt)}
                    </span>
                    <a
                      className="underline whitespace-nowrap"
                      href={`/api/waiver/download?userId=${user.id}&type=${w.documentType}`}
                    >
                      Download
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Payments</h2>
          {user.payments.length === 0 ? (
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
                {user.payments.map((p) => (
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

        <div className="card">
          <h2 className="font-semibold mb-3">Notes</h2>
          <form action="/api/admin/note" method="post" className="space-y-3">
            <input type="hidden" name="userId" value={user.id} />
            <textarea name="note" className="input min-h-[100px]" placeholder="Internal note…" required />
            <button className="btn" type="submit">Save note</button>
          </form>
        </div>
      </main>
    </>
  );
}
