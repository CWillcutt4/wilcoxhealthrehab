// Email provider wrapper.
// If RESEND_API_KEY is set, sends via Resend. Otherwise logs to console (dev mode).

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: string }[]; // content = base64 or utf8
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Wilcox Health and Rehab Center <noreply@example.com>";

  if (!apiKey) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[EMAIL — DEV MODE, no RESEND_API_KEY]");
    console.log(`  To:      ${Array.isArray(input.to) ? input.to.join(", ") : input.to}`);
    console.log(`  From:    ${from}`);
    console.log(`  Subject: ${input.subject}`);
    console.log(`  Body:\n${(input.text || stripHtml(input.html)).slice(0, 800)}`);
    if (input.attachments?.length) {
      console.log(`  Attachments: ${input.attachments.map((a) => a.filename).join(", ")}`);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { ok: true, id: "dev-" + Date.now() };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments,
    }),
  });

  if (!res.ok) {
    console.error("[EMAIL] Resend error:", await res.text());
    return { ok: false };
  }
  const data = (await res.json()) as { id?: string };
  return { ok: true, id: data.id };
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
