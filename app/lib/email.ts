/**
 * Order-alert email via Resend (resend.com). Server-side only.
 *
 * Env:
 *   RESEND_API_KEY   - from the Resend dashboard
 *   RESEND_FROM      - verified sender, e.g. "Embassy Orders <orders@embassypharma.com>"
 *                      (before you verify a domain, Resend only lets you send from
 *                      onboarding@resend.dev to your own account email)
 *
 * If either is unset, sends are skipped (logged) and the caller still succeeds.
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export function emailFrom(): string {
  return process.env.RESEND_FROM || "";
}

export type EmailResult = { ok: boolean; skipped?: boolean; sent?: number; error?: string };

/** Send one email to a list of addresses. Never throws. */
export async function sendEmail(
  to: string[],
  subject: string,
  html: string,
  text: string
): Promise<EmailResult> {
  if (!emailConfigured()) {
    console.warn("[email] not configured — skipping:", subject);
    return { ok: false, skipped: true };
  }
  const recipients = to.map((e) => e.trim()).filter(Boolean);
  if (recipients.length === 0) return { ok: false, skipped: true, error: "No email recipients." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: recipients,
        subject,
        html,
        text,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = data?.message || data?.error?.message || `Resend HTTP ${res.status}`;
      console.error("[email] send failed:", JSON.stringify(data));
      return { ok: false, error: err };
    }
    return { ok: true, sent: recipients.length };
  } catch (err: any) {
    console.error("[email] errored:", err?.message);
    return { ok: false, error: err?.message || "network error" };
  }
}

/* ---------- content ---------- */

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const ngn = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG");

export interface OrderEmailInput {
  code: string;
  customerName: string;
  phone: string;
  email?: string;
  items: { name: string; qty: number; lineTotal: number }[];
  total: number;
  methodLabel: string;
  refName?: string;
  hasBackorder?: boolean;
}

export function orderEmailContent(o: OrderEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `New order ${o.code} — ${ngn(o.total)} · ${o.customerName}`;

  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #e1d9c8">${esc(i.name)} &times;${i.qty}</td>` +
        `<td align="right" style="padding:6px 0;border-bottom:1px solid #e1d9c8">${ngn(i.lineTotal)}</td></tr>`
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16232b">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#0f2a3d;color:#e9d9b8;padding:16px 20px">
      <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase">Embassy Pharmaceutical &amp; Chemicals</div>
      <div style="font-size:18px;font-weight:700;color:#fff;margin-top:4px">New order ${esc(o.code)}</div>
    </div>
    <div style="background:#fff;border:1px solid #e1d9c8;border-top:0;padding:18px 20px">
      <p style="margin:0 0 4px"><strong>${esc(o.customerName)}</strong></p>
      <p style="margin:0 0 12px;color:#5b6a72;font-size:13px">${esc(o.phone)}${o.email ? " · " + esc(o.email) : ""}${o.refName ? " · via " + esc(o.refName) : ""}</p>
      <table width="100%" style="border-collapse:collapse;font-size:14px">${rows}
        <tr><td style="padding:10px 0 0;font-weight:700">Total</td><td align="right" style="padding:10px 0 0;font-weight:700">${ngn(o.total)}</td></tr>
      </table>
      <p style="margin:14px 0 0;font-size:13px;color:#5b6a72">Payment: ${esc(o.methodLabel)}</p>
      ${o.hasBackorder ? `<p style="margin:8px 0 0;font-size:13px;color:#8a5a16">Some items are out of stock — to be dispatched from regional store.</p>` : ""}
    </div>
    <p style="font-size:11px;color:#8a938c;margin:12px 0 0">You're receiving this because you're on Embassy's order-alert list. Manage recipients in the Rep console.</p>
  </div></body></html>`;

  const text =
    `New order ${o.code}\n${o.customerName} — ${o.phone}${o.email ? " · " + o.email : ""}` +
    `${o.refName ? " · via " + o.refName : ""}\n\n` +
    o.items.map((i) => `- ${i.name} x${i.qty}  ${ngn(i.lineTotal)}`).join("\n") +
    `\n\nTotal: ${ngn(o.total)}\nPayment: ${o.methodLabel}` +
    (o.hasBackorder ? `\nNote: some items out of stock, dispatch from regional store.` : "");

  return { subject, html, text };
}

export function testEmailContent(): { subject: string; html: string; text: string } {
  return {
    subject: "Embassy order alerts — test email",
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16232b">
      <p>This is a test from <strong>Embassy Pharmaceutical &amp; Chemicals</strong>.</p>
      <p>If you received this, order-alert emails are working — you'll get one like it (with the order details) every time a new order comes in.</p>
    </div>`,
    text: "Embassy order alerts test. If you got this, email alerts are working.",
  };
}
