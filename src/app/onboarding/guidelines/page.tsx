import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GUIDELINES_TEXT } from "@/lib/waiver-text";

export default async function GuidelinesPage({
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

  // Must sign the membership agreement first.
  const agreement = await prisma.waiver.findUnique({
    where: { userId_documentType: { userId: user.id, documentType: "membership_agreement" } },
  });
  if (!agreement) redirect("/onboarding/waiver");

  const existing = await prisma.waiver.findUnique({
    where: { userId_documentType: { userId: user.id, documentType: "guidelines" } },
  });
  if (existing) redirect("/onboarding/payment");

  const defaultName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
        <h1 className="text-2xl font-bold mb-1">Member Guidelines &amp; Rules</h1>
        <p className="text-sm text-neutral-600 mb-6">Step 4 of 5 — Guidelines &amp; Rules</p>

        {error && (
          <div className="card bg-red-50 border-red-200 text-sm text-red-700 mb-6">
            {error === "email_mismatch"
              ? "The email you re-typed doesn't match your account email. Please try again."
              : "Please complete all required fields before signing."}
          </div>
        )}

        <div className="card mb-6 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
          {GUIDELINES_TEXT}
        </div>

        <form action="/api/onboarding/waiver" method="post" className="space-y-4">
          <input type="hidden" name="documentType" value="guidelines" />

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
                I have read the Member Guidelines/Rules above, understand them, and agree to abide by
                the gym rules and special rules for the 24/7 membership at Wilcox Health and Rehab
                Center, LLC. I acknowledge that I am signing electronically on{" "}
                {new Date().toLocaleDateString()}.
              </span>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <a href="/onboarding/waiver" className="text-sm underline text-neutral-600">
              ← Back to Membership Agreement
            </a>
            <button type="submit" className="btn">Sign and continue to payment</button>
          </div>
        </form>
      </main>
    </>
  );
}
