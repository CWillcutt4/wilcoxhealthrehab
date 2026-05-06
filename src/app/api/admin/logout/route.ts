import { NextRequest, NextResponse } from "next/server";
import { destroyEmployeeSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await destroyEmployeeSession();
  return NextResponse.redirect(new URL("/admin/login", req.url), 303);
}
