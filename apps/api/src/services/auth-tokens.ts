import { UserRole } from "@landshoppers/db";

import { signAccessToken } from "../lib/jwt.js";
import { generateRefreshToken, hashRefreshToken } from "../lib/refresh-token.js";
import { prisma } from "../lib/prisma.js";

export type AuthSuccess = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

/** Persist refresh hash and return opaque refresh + signed access JWT. */
export async function issueSessionTokens(params: {
  userId: string;
  email: string;
  role: UserRole;
}): Promise<AuthSuccess> {
  const refreshRaw = generateRefreshToken();
  const refreshHash = hashRefreshToken(refreshRaw);

  await prisma.user.update({
    where: { id: params.userId },
    data: { refreshTokenHash: refreshHash },
  });

  const accessToken = await signAccessToken({
    sub: params.userId,
    role: params.role,
    email: params.email,
  });

  const expiresInSeconds = parseExpiresToSeconds(process.env["JWT_ACCESS_EXPIRES"] ?? "15m");

  return {
    accessToken,
    refreshToken: refreshRaw,
    expiresInSeconds,
  };
}

function parseExpiresToSeconds(exp: string): number {
  const m = /^(\d+)([smhd])$/i.exec(exp.trim());
  if (!m) return 900;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  switch (u) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      return 900;
  }
}
