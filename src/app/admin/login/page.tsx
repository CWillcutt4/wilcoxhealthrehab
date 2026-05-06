import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentEmployee } from "@/lib/auth";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const employee = await getCurrentEmployee();
  if (employee) redirect("/admin");
  const { error } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1">Employee login</h1>
          <p className="text-sm text-neutral-600 mb-6">Staff access only.</p>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <form action="/api/admin/login" method="post" className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input required id="email" name="email" type="email" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input required id="password" name="password" type="password" className="input" />
            </div>
            <button type="submit" className="btn w-full">Log in</button>
          </form>
        </div>
      </main>
    </>
  );
}
