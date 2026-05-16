import type { LeadsDigestPayload } from "./developer-leads-digest.js";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDigestEmail(input: {
  companyName: string;
  digest: LeadsDigestPayload;
}): { subject: string; text: string; html: string } {
  const { companyName, digest } = input;
  const periodLabel =
    digest.period === "all" ? "All time" : digest.period === "month" ? "Last 30 days" : "Last 7 days";
  const subject = `[LandShoppers] Lead digest — ${companyName} (${periodLabel})`;

  const lines: string[] = [
    `Lead digest for ${companyName}`,
    `Window: ${periodLabel} (since ${digest.since})`,
    `Generated: ${digest.generatedAt}`,
    "",
    `Inquiries in period: ${digest.totals.inquiriesInPeriod}`,
  ];
  if (Object.keys(digest.totals.byStatus).length > 0) {
    lines.push("", "By status:");
    for (const [k, v] of Object.entries(digest.totals.byStatus)) {
      if (v > 0) lines.push(`  ${k}: ${v}`);
    }
  }
  if (digest.byProject.length > 0) {
    lines.push("", "By project:");
    for (const p of digest.byProject) {
      lines.push(`  ${p.projectName} — ${p.count}`);
    }
  }
  if (digest.hotLeads.length > 0) {
    lines.push("", "Hot leads (heuristic):");
    for (const h of digest.hotLeads.slice(0, 12)) {
      lines.push(
        `  • ${h.projectName ?? "Project"} — score ${h.score.toFixed(0)} — ${h.reason}`,
        `    ${h.summary}`,
      );
    }
  } else {
    lines.push("", "No inquiries in this window.");
  }
  lines.push(
    "",
    "Open your developer portal: LandShoppers → Developer → Leads.",
    "",
    "— LandShoppers (automated)",
  );
  const text = lines.join("\n");

  const hotRows =
    digest.hotLeads.length === 0
      ? "<p><em>No inquiries in this window.</em></p>"
      : `<ul>${digest.hotLeads
          .slice(0, 12)
          .map(
            (h) =>
              `<li><strong>${esc(h.projectName ?? "Project")}</strong> — score ${h.score.toFixed(0)} — ${esc(h.reason)}<br/><span style="color:#444">${esc(h.summary)}</span></li>`,
          )
          .join("")}</ul>`;

  const byProj =
    digest.byProject.length === 0
      ? ""
      : `<h3>By project</h3><ul>${digest.byProject.map((p) => `<li>${esc(p.projectName)} — ${p.count}</li>`).join("")}</ul>`;

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5">
<h2>${esc(companyName)} — lead digest</h2>
<p><strong>${esc(periodLabel)}</strong> (since ${esc(digest.since)})</p>
<p>Inquiries in period: <strong>${digest.totals.inquiriesInPeriod}</strong></p>
${byProj}
<h3>Hot leads</h3>
${hotRows}
<p style="margin-top:24px;color:#666">LandShoppers developer portal — lead digest (automated).</p>
</body></html>`;

  return { subject, text, html };
}

export type SendDigestEmailResult =
  | { ok: true; mode: "resend"; id: string }
  | { ok: true; mode: "log_only" };

/** Resend HTTP API when `RESEND_API_KEY` is set; otherwise logs and returns `log_only`. */
export async function sendDigestEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendDigestEmailResult> {
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  const from = process.env["RESEND_FROM"]?.trim() ?? process.env["EMAIL_FROM"]?.trim() ?? "LandShoppers <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      `[digest-email] RESEND_API_KEY unset — log-only delivery to ${params.to}\n---\n${params.subject}\n${params.text}\n---`,
    );
    return { ok: true, mode: "log_only" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
    }),
  });
  const raw = await res.text();
  let json: unknown = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json
        ? String((json as { message: unknown }).message)
        : raw.slice(0, 200);
    throw new Error(`Resend error ${res.status}: ${msg}`);
  }
  const id =
    json && typeof json === "object" && "id" in json && typeof (json as { id: unknown }).id === "string"
      ? (json as { id: string }).id
      : "unknown";
  return { ok: true, mode: "resend", id };
}
