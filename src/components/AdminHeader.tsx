import Link from "next/link";
import { getCurrentEmployee } from "@/lib/auth";

export default async function AdminHeader() {
  const employee = await getCurrentEmployee();
  return (
    <header className="border-b border-neutral-200 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/admin" className="font-bold tracking-tight text-lg">
          SFC ADMIN
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="hover:underline">Members</Link>
          <Link href="/admin/add" className="hover:underline">Add member</Link>
          {employee && (
            <span className="text-neutral-400">
              {employee.name} ({employee.role})
            </span>
          )}
          <form action="/api/admin/logout" method="post">
            <button className="underline" type="submit">Log out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
