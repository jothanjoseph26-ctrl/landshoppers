import { UserRole } from "@landshoppers/db";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import {
  loginBodySchema,
  passwordResetConfirmBodySchema,
  passwordResetRequestBodySchema,
  refreshBodySchema,
  registerBodySchema,
  resendOtpBodySchema,
  verifyOtpBodySchema,
} from "../../contracts/auth.js";
import { ApiError } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
} from "../../lib/password-reset.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { hashRefreshToken } from "../../lib/refresh-token.js";
import { prisma } from "../../lib/prisma.js";
import { meToJson } from "../../lib/serialize/me.js";
import { requireAuth } from "../../middleware/auth.js";
import { issueSessionTokens } from "../../services/auth-tokens.js";
import type { ApiEnv } from "../../types/env.js";

const notImplemented = (c: { json: (body: unknown, status?: number) => Response }) =>
  c.json(
    {
      error: {
        code: "NOT_IMPLEMENTED",
        message: "This auth path is not implemented in the current slice.",
      },
    },
    501,
  );

export const authV1 = new Hono<ApiEnv>();

const registerRateLimit = rateLimit({
  bucket: "auth:register",
  limit: 10,
  windowSeconds: 60 * 15,
  keyFromContext: (c) => c.req.header("x-forwarded-for") ?? "unknown",
});

const loginRateLimit = rateLimit({
  bucket: "auth:login",
  limit: 20,
  windowSeconds: 60 * 5,
  keyFromContext: (c) => c.req.header("x-forwarded-for") ?? "unknown",
});

const otpRateLimit = rateLimit({
  bucket: "auth:otp",
  limit: 10,
  windowSeconds: 60 * 5,
  keyFromContext: (c) => c.req.header("x-forwarded-for") ?? "unknown",
});

const passwordResetRateLimit = rateLimit({
  bucket: "auth:password-reset",
  limit: 5,
  windowSeconds: 60 * 15,
  keyFromContext: (c) => c.req.header("x-forwarded-for") ?? "unknown",
});

authV1.post("/register", registerRateLimit, zValidator("json", registerBodySchema), async (c) => {
  const body = c.req.valid("json");
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }

  const passwordHash = await hashPassword(body.password);
  const role = body.role ?? UserRole.buyer;

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      role,
      isEmailVerified: false,
      phone: body.phone,
      profile: {
        create: {},
      },
      ...(role === UserRole.agent
        ? {
            agent: {
              create: {
                specializations: [],
              },
            },
          }
        : {}),
      ...(role === UserRole.developer
        ? {
            developer: {
              create: {
                companyName:
                  body.companyName?.trim() ||
                  body.email.split("@")[0] ||
                  "Developer",
              },
            },
          }
        : {}),
    },
  });

  const tokens = await issueSessionTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return c.json(
    {
      data: {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresInSeconds,
      },
    },
    201,
  );
});

authV1.post("/login", loginRateLimit, zValidator("json", loginBodySchema), async (c) => {
  const body = c.req.valid("json");
  const user = await prisma.user.findFirst({
    where: { email: body.email, deletedAt: null },
  });

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(423, "ACCOUNT_LOCKED", "Account temporarily locked; try again later");
  }

  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) {
    const fails = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: fails,
        lockedUntil: fails >= 8 ? new Date(Date.now() + 15 * 60 * 1000) : user.lockedUntil,
      },
    });
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  const tokens = await issueSessionTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return c.json({
    data: {
      user: { id: user.id, email: user.email, role: user.role },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresInSeconds,
    },
  });
});

authV1.post("/refresh", zValidator("json", refreshBodySchema), async (c) => {
  const body = c.req.valid("json");
  const hash = hashRefreshToken(body.refreshToken);
  const user = await prisma.user.findFirst({
    where: { refreshTokenHash: hash, deletedAt: null },
  });

  if (!user) {
    throw new ApiError(401, "INVALID_REFRESH", "Refresh token is invalid or revoked");
  }

  const tokens = await issueSessionTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return c.json({
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresInSeconds,
    },
  });
});

authV1.post("/logout", requireAuth, async (c) => {
  const authUser = c.get("authUser");
  if (!authUser) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  }

  await prisma.user.update({
    where: { id: authUser.id },
    data: { refreshTokenHash: null },
  });

  return c.json({ data: { ok: true } });
});

authV1.post("/verify-otp", zValidator("json", verifyOtpBodySchema), async (c) => {
  const body = c.req.valid("json");
  const devCode = process.env["DEV_OTP_CODE"] ?? "000000";
  if (body.code !== devCode) {
    throw new ApiError(400, "INVALID_OTP", "OTP code is invalid or expired");
  }

  const user = await prisma.user.findFirst({
    where: { email: body.email, deletedAt: null },
  });
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true },
  });

  return c.json({
    data: {
      ok: true,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        isEmailVerified: updated.isEmailVerified,
      },
    },
  });
});

authV1.post("/resend-otp", zValidator("json", resendOtpBodySchema), async (c) => {
  const body = c.req.valid("json");
  const user = await prisma.user.findFirst({
    where: { email: body.email, deletedAt: null },
  });
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  return c.json({
    data: {
      ok: true,
      delivery: "dev",
      expiresInSeconds: 300,
      code: process.env["DEV_OTP_CODE"] ?? "000000",
    },
  });
});

authV1.get("/google/start", (c) => notImplemented(c));

authV1.get("/google/callback", (c) => notImplemented(c));
