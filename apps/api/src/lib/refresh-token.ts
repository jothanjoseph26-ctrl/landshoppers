import { createHash, randomBytes } from "node:crypto";

/** Store SHA-256 hex of opaque refresh token in `users.refreshTokenHash`. */

export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
