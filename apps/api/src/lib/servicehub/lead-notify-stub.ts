/**
 * Phase B: real email delivery is a later increment. Log + disable with SERVICEHUB_LEAD_EMAIL_STUB=0.
 */
export function stubServiceLeadEmailNotify(payload: {
  providerUserId: string;
  leadId: string;
  clientName: string;
  serviceRequested: string;
}) {
  if (process.env["SERVICEHUB_LEAD_EMAIL_STUB"]?.trim() === "0") {
    return;
  }
  console.info("[servicehub] EMAIL_STUB new lead → provider user", {
    ...payload,
  });
}
