import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getCurrentEmployee } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const targetUserId = url.searchParams.get("userId");
  const documentType = url.searchParams.get("type");

  let userId: string | null = null;

  if (targetUserId) {
    const employee = await getCurrentEmployee();
    if (!employee) return new NextResponse("Unauthorized", { status: 401 });
    userId = targetUserId;
  } else {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    userId = user.id;
  }

  const waiver = await prisma.waiver.findFirst({
    where: documentType ? { userId, documentType } : { userId },
    orderBy: { signedAt: "desc" },
    include: { user: true },
  });
  if (!waiver) return new NextResponse("Not found", { status: 404 });

  const docLabel =
    waiver.documentType === "membership_agreement"
      ? "MEMBERSHIP AGREEMENT & LIABILITY WAIVER"
      : "MEMBER GUIDELINES / RULES";

  const content = [
    "WILCOX HEALTH AND REHAB CENTER, LLC",
    `${docLabel} — SIGNED COPY`,
    "",
    `Member: ${waiver.user.firstName} ${waiver.user.lastName}`,
    `Account email: ${waiver.user.email}`,
    `Signed name: ${waiver.signedName}`,
    `Re-typed email: ${waiver.signedEmail}`,
    `Signed at: ${waiver.signedAt.toISOString()}`,
    `IP address: ${waiver.ipAddress || "unknown"}`,
    `User agent: ${waiver.userAgent || "unknown"}`,
    "",
    `--- ${docLabel} ---`,
    "",
    waiver.waiverText,
  ].join("\n");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${waiver.documentType}-${waiver.user.lastName}-${waiver.id}.txt"`,
    },
  });
}
