import { NextRequest, NextResponse } from "next/server";
import { runMembershipSweep } from "@/lib/membership";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runMembershipSweep();
  return NextResponse.json({ ok: true, ...result });
}

export const POST = GET;
