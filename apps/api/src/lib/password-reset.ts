import { createHash, randomBytes } from "node:crypto";

import type { User } from "@landshoppers/db";

import { prisma } from "./prisma.js";

const TOKEN_TTL_SECONDS = 60 * 30;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Persist hashed reset token + expiry on the user. Raw token returned for delivery. */
export async function createPasswordResetToken(
  userId: string,
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetTokenHash: hashToken(rawToken),
      passwordResetExpiresAt: expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

/** Single-use lookup; returns the user when token matches and is unexpired. */
export async function consumePasswordResetToken(rawToken: string): Promise<User | null> {
  const tokenHash = hashToken(rawToken);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      deletedAt: null,
    },
  });
  if (!user) return null;
  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    return null;
  }
  return user;
}
