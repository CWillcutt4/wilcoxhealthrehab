import Link from "next/link";
import Header from "@/components/Header";
import { listPlans, formatDollars } from "@/lib/plans";

export default function HomePage() {
  const plans = listPlans();
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Wilcox Health and Rehab Center
          </h1>
          <p className="text-neutral-600 text-lg max-w-xl mx-auto mb-8">
            Join today. Sign up online, pay securely, and get your electronic key by email.
          </p>
          <Link href="/signup" className="btn text-base px-6 py-3">
            Become a member
          </Link>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl font-bold mb-8 text-center">Memberships</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.code} className="card">
                <h3 className="font-semibold text-lg mb-1">{p.label}</h3>
                <p className="text-sm text-neutral-600 mb-4">{p.description}</p>
                <div className="text-2xl font-bold">
                  {formatDollars(p.basePriceCents)}
                  <span className="text-sm font-normal text-neutral-500">
                    {" "}
                    / {p.billingCycle === "weekly" ? "wk" : p.billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl font-bold mb-6 text-center">How signup works</h2>
          <ol className="max-w-2xl mx-auto space-y-3 text-neutral-700 list-decimal list-inside">
            <li>Create your account with an email and password.</li>
            <li>Pick a membership plan.</li>
            <li>Sign the Membership Agreement and Liability Waiver.</li>
            <li>Sign the Member Guidelines &amp; Rules.</li>
            <li>Pay securely through Shopify.</li>
            <li>Receive your Viztin electronic key by email.</li>
          </ol>
        </section>
      </main>
      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Wilcox Health and Rehab Center, LLC
      </footer>
    </>
  );
}
