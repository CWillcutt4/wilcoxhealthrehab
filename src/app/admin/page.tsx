import { redirect } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";
import { getCurrentEmployee } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDollars } from "@/lib/plans";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/admin/login");
  const { q, status } = await searchParams;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: { membership: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const filtered = status
    ? users.filter((u) => u.membership?.status === status)
    : users;

  // Revenue summary — last 30 days.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPayments = await prisma.payment.findMany({
    where: { status: "succeeded", paidAt: { gte: since } },
  });
  const revenue30d = recentPayments.reduce((a, p) => a + p.amountCents, 0);

  const counts = {
    active: users.filter((u) => u.membership?.status === "active").length,
    grace: users.filter((u) => u.membership?.status === "grace").length,
    disabled: users.filter((u) => u.membership?.status === "disabled").length,
    total: users.length,
  };

  return (
    <>
      <AdminHeader />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card">
            <div className="text-xs text-neutral-500">Total members</div>
            <div className="text-2xl font-bold">{counts.total}</div>
          </div>
          <div className="card">
            <div className="text-xs text-neutral-500">Active</div>
            <div className="text-2xl font-bold text-green-700">{counts.active}</div>
          </div>
          <div className="card">
            <div className="text-xs text-neutral-500">Grace / disabled</div>
            <div className="text-2xl font-bold text-yellow-700">
              {counts.grace} / {counts.disabled}
            </div>
          </div>
          <div className="card">
            <div className="text-xs text-neutral-500">Revenue (30d)</div>
            <div className="text-2xl font-bold">{formatDollars(revenue30d)}</div>
          </div>
        </div>

        <form method="get" className="flex gap-2 mb-4">
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search name or email…"
            className="input flex-1"
          />
          <select name="status" defaultValue={status || ""} className="input max-w-[160px]">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="grace">Grace</option>
            <option value="disabled">Disabled</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn" type="submit">Search</button>
        </form>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Plan</th>
                <th className="py-2">Status</th>
                <th className="py-2">Key</th>
                <th className="py-2">Ends</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100">
                  <td className="py-2">{u.firstName} {u.lastName}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.membership?.planLabel || "—"}</td>
                  <td className="py-2">{u.membership?.status || "—"}</td>
                  <td className="py-2">
                    {u.membership?.keyDisabled
                      ? "Disabled"
                      : u.membership?.keyIssued
                      ? "Active"
                      : "—"}
                  </td>
                  <td className="py-2">
                    {u.membership?.endDate
                      ? new Date(u.membership.endDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-2">
                    <Link href={`/admin/members/${u.id}`} className="underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-neutral-500">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
