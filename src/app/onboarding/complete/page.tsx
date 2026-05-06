import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function CompletePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  if (!membership || membership.status === "pending") redirect("/onboarding/payment");

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full text-center">
        <h1 className="text-3xl font-bold mb-3">You're in!</h1>
        <p className="text-neutral-600 mb-8">
          Welcome to Wilcox Health and Rehab Center, {user.firstName}. Your membership is active.
        </p>

        <div className="card text-left mb-6">
          <h2 className="font-semibold mb-3">Next steps</h2>
          <ol className="space-y-3 text-sm list-decimal list-inside text-neutral-700">
            <li>
              <b>Check your email.</b> We've sent you a welcome message with instructions
              to activate your Viztin electronic key.
            </li>
            <li>
              <b>Download the Viztin app</b> on your phone:
              <div className="ml-5 mt-1 space-x-4">
                <a className="underline" href="https://apps.apple.com/us/app/viztin/id1526456456" target="_blank" rel="noreferrer">
                  iOS
                </a>
                <a className="underline" href="https://play.google.com/store/apps/details?id=com.viztin" target="_blank" rel="noreferrer">
                  Android
                </a>
              </div>
            </li>
            <li>
              <b>Sign in to the Viztin app</b> with the email you used here to receive your key.
            </li>
            <li>
              <b>Use your phone at the gym door</b> — that's your key.
            </li>
          </ol>
        </div>

        <div className="card text-left mb-8">
          <h2 className="font-semibold mb-2">Your waiver</h2>
          <p className="text-sm text-neutral-600 mb-3">
            A signed copy was emailed to you. You can also download it anytime from your dashboard.
          </p>
        </div>

        <Link href="/dashboard" className="btn">Go to dashboard</Link>
      </main>
    </>
  );
}
