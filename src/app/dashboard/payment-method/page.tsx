import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

export default async function PaymentMethodPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <h1 className="text-2xl font-bold mb-6">Update payment method</h1>
        <div className="card">
          <p className="text-sm text-neutral-700 mb-4">
            Payment methods are managed securely by Shopify. Click below to update your card
            on file through Shopify's customer portal.
          </p>
          <p className="text-xs text-neutral-500 mb-4">
            In dev mode (no Shopify credentials), this button is disabled.
          </p>
          <a
            href={process.env.SHOPIFY_CUSTOMER_PORTAL_URL || "#"}
            className="btn"
            target="_blank"
            rel="noreferrer"
          >
            Open Shopify customer portal
          </a>
        </div>
        <Link href="/dashboard" className="inline-block mt-6 text-sm underline">
          ← Back to dashboard
        </Link>
      </main>
    </>
  );
}
