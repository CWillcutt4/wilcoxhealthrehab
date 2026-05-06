import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/onboarding/plan");

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1">Create account</h1>
          <p className="text-sm text-neutral-600 mb-6">Step 1 of 5 — Account</p>
          <form action="/api/auth/signup" method="post" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="firstName">First name</label>
                <input required id="firstName" name="firstName" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="lastName">Last name</label>
                <input required id="lastName" name="lastName" className="input" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input required id="email" name="email" type="email" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input required id="password" name="password" type="password" minLength={8} className="input" />
              <p className="text-xs text-neutral-500 mt-1">8+ characters.</p>
            </div>
            <button type="submit" className="btn w-full">Continue</button>
            <p className="text-xs text-center text-neutral-500 pt-2">
              Already a member? <Link href="/login" className="underline">Log in</Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
