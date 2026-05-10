import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validates `X-Landshoppers-Signature: sha256=<hex>` (HMAC-SHA256 of the raw body).
 * When `secret` is empty, validation is skipped (local dev only).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret?.trim()) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const provided = signatureHeader.slice("sha256=".length).trim();
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  try {
    const a = Buffer.from(provided, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
