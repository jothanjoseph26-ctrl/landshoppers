import { UserRole } from "@landshoppers/db";
import { z } from "zod";

/** POST /v1/auth/register — buyer, agent, or developer (minimal developer profile). */
export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z
    .union([
      z.literal(UserRole.buyer),
      z.literal(UserRole.agent),
      z.literal(UserRole.developer),
    ])
    .optional(),
  phone: z.string().min(5).max(32).optional(),
  /** Required for a polished developer signup; otherwise derived from email local-part. */
  companyName: z.string().min(2).max(160).optional(),
});

/** POST /v1/auth/login */
export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

/** POST /v1/auth/refresh */
export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

/** POST /v1/auth/verify-otp */
export const verifyOtpBodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
});

/** POST /v1/auth/resend-otp */
export const resendOtpBodySchema = z.object({
  email: z.string().email(),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
