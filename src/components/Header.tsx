import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight text-lg">
          WILCOX HEALTH AND REHAB CENTER
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="tab">Dashboard</Link>
              <form action="/api/auth/logout" method="post">
                <button className="btn-outline" type="submit">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="tab">Log in</Link>
              <Link href="/signup" className="btn">Join</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
