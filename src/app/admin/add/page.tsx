import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import { getCurrentEmployee } from "@/lib/auth";
import { listPlans, formatDollars } from "@/lib/plans";

export default async function AdminAddMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/admin/login");
  const { error } = await searchParams;
  const plans = listPlans();

  return (
    <>
      <AdminHeader />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-8 w-full">
        <h1 className="text-2xl font-bold mb-1">Add member manually</h1>
        <p className="text-sm text-neutral-600 mb-6">
          For in-person signups. Creates account + active membership without requiring online payment.
        </p>
        {error && <p className="card bg-red-50 text-red-700 text-sm mb-4">{error}</p>}

        <form action="/api/admin/add-member" method="post" className="space-y-4">
          <div className="card grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="firstName">First name</label>
              <input required id="firstName" name="firstName" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="lastName">Last name</label>
              <input required id="lastName" name="lastName" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="email">Email</label>
              <input required id="email" name="email" type="email" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="password">Temporary password</label>
              <input required id="password" name="password" type="text" minLength={8} className="input" />
              <p className="text-xs text-neutral-500 mt-1">Share with member; they can change it after login.</p>
            </div>
          </div>

          <div className="card">
            <label className="label" htmlFor="planCode">Plan</label>
            <select required id="planCode" name="planCode" className="input">
              {plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label} — {formatDollars(p.basePriceCents)}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="label" htmlFor="numKids">Kids</label>
                <input id="numKids" name="numKids" type="number" min={0} max={10} defaultValue={0} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="paid">Mark as paid</label>
                <select id="paid" name="paid" className="input" defaultValue="1">
                  <option value="1">Yes — record cash payment + activate</option>
                  <option value="0">No — leave pending</option>
                </select>
              </div>
            </div>
          </div>

          <button className="btn" type="submit">Create member</button>
        </form>
      </main>
    </>
  );
}
