export function stubServiceReviewInviteNotify(payload: {
  clientUserId: string;
  leadId: string;
  providerBusinessName: string;
}) {
  if (process.env["SERVICEHUB_REVIEW_INVITE_EMAIL_STUB"]?.trim() === "0") {
    return;
  }
  console.info("[servicehub] EMAIL_STUB review invite → client user", payload);
}
