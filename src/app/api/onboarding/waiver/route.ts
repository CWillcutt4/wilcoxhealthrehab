import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { MEMBERSHIP_AGREEMENT_TEXT, GUIDELINES_TEXT } from "@/lib/waiver-text";
import { sendEmail, stripHtml } from "@/lib/email";

type DocumentType = "membership_agreement" | "guidelines";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const form = await req.formData();
  const documentType = String(form.get("documentType") || "") as DocumentType;
  const signedName = String(form.get("signedName") || "").trim();
  const signedEmail = String(form.get("signedEmail") || "").trim().toLowerCase();
  const agree = form.get("agree") === "1";

  if (documentType !== "membership_agreement" && documentType !== "guidelines") {
    return NextResponse.redirect(new URL("/onboarding/waiver?error=1", req.url), 303);
  }

  const sourcePage = documentType === "guidelines" ? "/onboarding/guidelines" : "/onboarding/waiver";

  if (!signedName || !signedEmail || !agree) {
    return NextResponse.redirect(new URL(`${sourcePage}?error=1`, req.url), 303);
  }

  if (signedEmail !== user.email.trim().toLowerCase()) {
    return NextResponse.redirect(new URL(`${sourcePage}?error=email_mismatch`, req.url), 303);
  }

  // Membership Agreement: also collects the member profile fields.
  if (documentType === "membership_agreement") {
    const fullName = String(form.get("fullName") || "").trim();
    const dobStr = String(form.get("dob") || "").trim();
    const address = String(form.get("address") || "").trim();
    const city = String(form.get("city") || "").trim();
    const zip = String(form.get("zip") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const cellPhone = String(form.get("cellPhone") || "").trim();
    const emergencyContactName = String(form.get("emergencyContactName") || "").trim();
    const emergencyContactPhone = String(form.get("emergencyContactPhone") || "").trim();

    if (!fullName || !dobStr || !address || !city || !zip || !cellPhone || !emergencyContactName || !emergencyContactPhone) {
      return NextResponse.redirect(new URL(`${sourcePage}?error=1`, req.url), 303);
    }

    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) {
      return NextResponse.redirect(new URL(`${sourcePage}?error=1`, req.url), 303);
    }

    // Split fullName into first/last for convenience (keep existing if only one token).
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ") || user.lastName;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: firstName || user.firstName,
        lastName,
        dob,
        address,
        city,
        zip,
        phone: phone || null,
        cellPhone,
        emergencyContactName,
        emergencyContactPhone,
      },
    });
  }

  const waiverText = documentType === "membership_agreement" ? MEMBERSHIP_AGREEMENT_TEXT : GUIDELINES_TEXT;

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;

  const waiver = await prisma.waiver.upsert({
    where: { userId_documentType: { userId: user.id, documentType } },
    update: {
      signedName,
      signedEmail,
      signedAt: new Date(),
      ipAddress,
      userAgent,
      waiverText,
    },
    create: {
      userId: user.id,
      documentType,
      signedName,
      signedEmail,
      signedAt: new Date(),
      ipAddress,
      userAgent,
      waiverText,
    },
  });

  const docLabel =
    documentType === "membership_agreement"
      ? "Membership Agreement & Liability Waiver"
      : "Member Guidelines / Rules";

  const ownerEmail = process.env.OWNER_EMAIL || "";
  const html = `
    <h2>Wilcox Health and Rehab Center — ${docLabel}</h2>
    <p><b>Signed by:</b> ${signedName}</p>
    <p><b>Account email:</b> ${user.email}</p>
    <p><b>Re-typed email:</b> ${signedEmail}</p>
    <p><b>Signed at:</b> ${waiver.signedAt.toISOString()}</p>
    <p><b>IP:</b> ${ipAddress || "unknown"}</p>
    <hr />
    <pre style="white-space:pre-wrap;font-family:inherit">${waiverText}</pre>
  `;

  await sendEmail({
    to: user.email,
    subject: `Your signed ${docLabel} — Wilcox Health and Rehab Center`,
    html,
    text: stripHtml(html),
  });
  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `${docLabel} signed by ${user.firstName} ${user.lastName}`,
      html,
      text: stripHtml(html),
    });
  }

  const next = documentType === "membership_agreement" ? "/onboarding/guidelines" : "/onboarding/payment";
  return NextResponse.redirect(new URL(next, req.url), 303);
}
