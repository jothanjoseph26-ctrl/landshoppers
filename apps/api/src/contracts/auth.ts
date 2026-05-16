import { ServiceCategory, UserRole } from "@landshoppers/db";
import { z } from "zod";

/** POST /v1/auth/register — buyer, agent, developer, or service provider (minimal profiles). */
export const registerBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    role: z
      .union([
        z.literal(UserRole.buyer),
        z.literal(UserRole.agent),
        z.literal(UserRole.developer),
        z.literal(UserRole.service_provider),
      ])
      .optional(),
    phone: z.string().min(5).max(32).optional(),
    /** Required for a polished developer signup; otherwise derived from email local-part. */
    companyName: z.string().min(2).max(160).optional(),
    /** Service provider brand name; defaults from email local-part when omitted. */
    providerBusinessName: z.string().min(2).max(160).optional(),
    providerCategory: z.nativeEnum(ServiceCategory).optional(),
    providerCity: z.string().min(1).max(100).optional(),
    providerState: z.string().min(1).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== UserRole.service_provider) return;
    if (!data.providerCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "providerCategory is required for service_provider registration",
        path: ["providerCategory"],
      });
    }
    if (!data.providerCity?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "providerCity is required for service_provider registration",
        path: ["providerCity"],
      });
    }
    if (!data.providerState?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "providerState is required for service_provider registration",
        path: ["providerState"],
      });
    }
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

/** POST /v1/auth/password-reset/request */
export const passwordResetRequestBodySchema = z.object({
  email: z.string().email(),
});

/** POST /v1/auth/password-reset/confirm */
export const passwordResetConfirmBodySchema = z.object({
  token: z.string().min(16).max(256),
  password: z.string().min(8).max(128),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type PasswordResetRequestBody = z.infer<typeof passwordResetRequestBodySchema>;
export type PasswordResetConfirmBody = z.infer<typeof passwordResetConfirmBodySchema>;
