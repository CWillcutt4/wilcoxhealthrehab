import { NextRequest, NextResponse } from "next/server";
import { destroyUserSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await destroyUserSession();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
