// Viztin integration.
//
// As of writing, Viztin does not publish a documented public API for issuing
// or revoking electronic keys. Until you confirm otherwise with their support,
// this module falls back to emailing the owner with a request to issue/revoke
// the key manually in the Viztin admin panel.
//
// When/if Viztin provides an API:
//   1. Set VIZTIN_API_URL and VIZTIN_API_TOKEN in .env
//   2. Fill in the two fetch() calls below and return the key reference id.

import { sendEmail } from "./email";

const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@wilcoxhealthrehab.example";

export interface IssueKeyInput {
  userId: string;
  userEmail: string;
  firstName: string;
  lastName: string;
  planLabel: string;
}

export interface IssueKeyResult {
  ok: boolean;
  keyReference?: string;
  manual: boolean;
}

export async function issueViztinKey(input: IssueKeyInput): Promise<IssueKeyResult> {
  const apiUrl = process.env.VIZTIN_API_URL;
  const apiToken = process.env.VIZTIN_API_TOKEN;

  if (!apiUrl || !apiToken) {
    // Manual fallback: tell the owner + the member.
    await sendEmail({
      to: OWNER_EMAIL,
      subject: `[Wilcox Health and Rehab] Issue Viztin key for ${input.firstName} ${input.lastName}`,
      html: `
        <p>A new member has completed signup and payment.</p>
        <ul>
          <li><b>Name:</b> ${input.firstName} ${input.lastName}</li>
          <li><b>Email:</b> ${input.userEmail}</li>
          <li><b>Plan:</b> ${input.planLabel}</li>
          <li><b>Member ID:</b> ${input.userId}</li>
        </ul>
        <p>Please log in to your Viztin admin panel and issue this member an electronic key, then reply to the member at ${input.userEmail}.</p>
      `,
    });

    await sendEmail({
      to: input.userEmail,
      subject: "Welcome to Wilcox Health and Rehab Center — your Viztin key",
      html: welcomeKeyEmail(input),
    });

    return { ok: true, manual: true };
  }

  // TODO: real Viztin API call.
  // const res = await fetch(`${apiUrl}/keys`, {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({ email: input.userEmail, firstName: input.firstName, lastName: input.lastName }),
  // });
  // const data = await res.json();
  // await sendEmail({ to: input.userEmail, subject: "Welcome...", html: welcomeKeyEmail(input) });
  // return { ok: res.ok, keyReference: data.id, manual: false };

  throw new Error("Real Viztin integration not implemented yet.");
}

export async function revokeViztinKey(keyReference: string | null): Promise<{ ok: boolean; manual: boolean }> {
  const apiUrl = process.env.VIZTIN_API_URL;
  const apiToken = process.env.VIZTIN_API_TOKEN;

  if (!apiUrl || !apiToken) {
    await sendEmail({
      to: OWNER_EMAIL,
      subject: `[Wilcox Health and Rehab] Disable Viztin key`,
      html: `<p>Please disable the Viztin key associated with reference: <b>${keyReference ?? "(unknown)"}</b>.</p>`,
    });
    return { ok: true, manual: true };
  }

  // TODO: real Viztin revoke call.
  throw new Error("Real Viztin revoke not implemented yet.");
}

function welcomeKeyEmail(input: IssueKeyInput): string {
  return `
    <h2>Welcome to Wilcox Health and Rehab Center!</h2>
    <p>Hi ${input.firstName},</p>
    <p>Your <b>${input.planLabel}</b> membership is active. Here's how to access the facility:</p>
    <ol>
      <li>Download the <b>Viztin</b> app on your phone:
        <ul>
          <li><a href="https://apps.apple.com/app/viztin">iPhone — App Store</a></li>
          <li><a href="https://play.google.com/store/apps/details?id=com.viztin">Android — Google Play</a></li>
        </ul>
      </li>
      <li>Open the app and sign in with this email address: <b>${input.userEmail}</b></li>
      <li>Your electronic key will appear in the app. Hold your phone up to the reader at the door to enter.</li>
    </ol>
    <p>If your key hasn't arrived within 24 hours, reply to this email and we'll sort it out right away.</p>
    <p>— Wilcox Health and Rehab Center</p>
  `;
}
