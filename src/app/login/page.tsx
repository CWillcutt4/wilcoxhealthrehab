import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">Log in</h1>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <form action="/api/auth/login" method="post" className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input required id="email" name="email" type="email" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input required id="password" name="password" type="password" className="input" />
            </div>
            <button type="submit" className="btn w-full">Log in</button>
            <p className="text-xs text-center text-neutral-500 pt-2">
              New here? <Link href="/signup" className="underline">Create an account</Link>
            </p>
            <p className="text-xs text-center text-neutral-500">
              <Link href="/admin/login" className="underline">Employee login</Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
