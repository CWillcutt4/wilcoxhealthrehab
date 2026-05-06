import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MEMBERSHIP_AGREEMENT_TEXT } from "@/lib/waiver-text";

export default async function MembershipAgreementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error } = await searchParams;

  const membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  if (!membership) redirect("/onboarding/plan");
  if (membership.status === "active" || membership.status === "grace") redirect("/dashboard");

  const existing = await prisma.waiver.findUnique({
    where: { userId_documentType: { userId: user.id, documentType: "membership_agreement" } },
  });
  if (existing) redirect("/onboarding/guidelines");

  const defaultName = `${user.firstName} ${user.lastName}`.trim();
  const dobStr = user.dob ? new Date(user.dob).toISOString().slice(0, 10) : "";

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
        <h1 className="text-2xl font-bold mb-1">Membership Agreement</h1>
        <p className="text-sm text-neutral-600 mb-6">Step 3 of 5 — Membership Agreement &amp; Liability Waiver</p>

        {error && (
          <div className="card bg-red-50 border-red-200 text-sm text-red-700 mb-6">
            {error === "email_mismatch"
              ? "The email you re-typed doesn't match your account email. Please try again."
              : "Please complete all required fields before signing."}
          </div>
        )}

        <form action="/api/onboarding/waiver" method="post" className="space-y-4">
          <input type="hidden" name="documentType" value="membership_agreement" />

          <div className="card space-y-4">
            <h2 className="font-semibold">Your information</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="fullName">Full name</label>
                <input id="fullName" name="fullName" required defaultValue={defaultName} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="dob">Date of birth</label>
                <input id="dob" name="dob" type="date" required defaultValue={dobStr} className="input" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="address">Address</label>
              <input id="address" name="address" required defaultValue={user.address ?? ""} className="input" />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="city">City</label>
                <input id="city" name="city" required defaultValue={user.city ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="zip">ZIP</label>
                <input id="zip" name="zip" required defaultValue={user.zip ?? ""} className="input" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="phone">Home phone</label>
                <input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="cellPhone">Cell phone</label>
                <input id="cellPhone" name="cellPhone" type="tel" required defaultValue={user.cellPhone ?? ""} className="input" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="emergencyContactName">Emergency contact name</label>
                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  required
                  defaultValue={user.emergencyContactName ?? ""}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="emergencyContactPhone">Emergency contact phone</label>
                <input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  required
                  defaultValue={user.emergencyContactPhone ?? ""}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card mb-0 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
            {MEMBERSHIP_AGREEMENT_TEXT}
          </div>

          <div className="card space-y-4">
            <div>
              <label className="label" htmlFor="signedName">Type your full legal name to sign</label>
              <input
                required
                id="signedName"
                name="signedName"
                defaultValue={defaultName}
                className="input"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label" htmlFor="signedEmail">Re-type your email to confirm</label>
              <input
                required
                id="signedEmail"
                name="signedEmail"
                type="email"
                className="input"
                autoComplete="off"
                placeholder={user.email}
              />
              <p className="text-xs text-neutral-500 mt-1">Must match your account email: {user.email}</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input required type="checkbox" name="agree" value="1" className="mt-1" />
              <span className="text-sm">
                I have read the Membership Agreement and Liability Waiver above, understand its terms,
                and agree to be bound by it. I acknowledge that I am signing electronically on{" "}
                {new Date().toLocaleDateString()}.
              </span>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <a href="/onboarding/plan" className="text-sm underline text-neutral-600">
              ← Back to plan
            </a>
            <button type="submit" className="btn">Sign and continue</button>
          </div>
        </form>
      </main>
    </>
  );
}
