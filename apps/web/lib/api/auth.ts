import { ApiRequestError, apiFetch } from "./client"
import { getAccessToken, persistAuthSession } from "./auth-session"

/** POST /v1/auth/register — body matches `@landshoppers/api` contracts/auth.ts */
export async function registerAccount(body: {
  email: string
  password: string
  role?: "buyer" | "agent" | "developer"
  phone?: string
  companyName?: string
}): Promise<unknown> {
  const json = await apiFetch<unknown>("/v1/auth/register", {
    method: "POST",
    body: {
      email: body.email,
      password: body.password,
      ...(body.role ? { role: body.role } : {}),
      ...(body.phone ? { phone: body.phone } : {}),
      ...(body.companyName ? { companyName: body.companyName } : {}),
    },
  })
  tryCaptureTokens(json)
  return json
}

/** POST /v1/auth/login */
export async function loginAccount(body: {
  email: string
  password: string
}): Promise<unknown> {
  const json = await apiFetch<unknown>("/v1/auth/login", {
    method: "POST",
    body,
  })
  tryCaptureTokens(json)
  return json
}

export type AuthRole =
  | "buyer"
  | "agent"
  | "developer"
  | "admin"
  | "super_admin"

export function dashboardPathForRole(role: AuthRole | string | undefined): string {
  switch (role) {
    case "agent":
      return "/agent"
    case "developer":
      return "/developer"
    case "admin":
    case "super_admin":
      return "/admin"
    case "buyer":
    default:
      return "/buyer"
  }
}

export function authUserRole(json: unknown): AuthRole | undefined {
  if (!json || typeof json !== "object") return undefined
  const data = (json as { data?: unknown }).data
  if (!data || typeof data !== "object") return undefined
  const user = (data as { user?: unknown }).user
  if (!user || typeof user !== "object") return undefined
  const role = (user as { role?: unknown }).role
  return typeof role === "string" ? (role as AuthRole) : undefined
}

/** POST /v1/auth/verify-otp */
export async function verifyOtp(body: {
  email: string
  code: string
}): Promise<unknown> {
  const json = await apiFetch<unknown>("/v1/auth/verify-otp", {
    method: "POST",
    body,
  })
  tryCaptureTokens(json)
  return json
}

export async function resendOtp(body: { email: string }): Promise<unknown> {
  return apiFetch<unknown>("/v1/auth/resend-otp", {
    method: "POST",
    body,
  })
}

/** POST /v1/auth/logout — revokes refresh server-side; clears client session separately. */
export async function logoutAccount(): Promise<void> {
  if (!getAccessToken()) return
  try {
    await apiFetch<unknown>("/v1/auth/logout", { method: "POST", auth: true })
  } catch {
    /* still clear local session */
  }
}

/** Best-effort: persist tokens when API returns a conventional envelope. */
function tryCaptureTokens(json: unknown): void {
  if (!json || typeof json !== "object") return
  const data = (json as { data?: unknown }).data
  if (!data || typeof data !== "object") return
  const d = data as Record<string, unknown>
  const access =
    (typeof d.accessToken === "string" && d.accessToken) ||
    (typeof d.access_token === "string" && d.access_token) ||
    ""
  const refresh =
    (typeof d.refreshToken === "string" && d.refreshToken) ||
    (typeof d.refresh_token === "string" && d.refresh_token) ||
    undefined
  if (access) {
    persistAuthSession(access, refresh)
  }
}

export function formatAuthError(err: unknown, notImplementedHint: string): string {
  if (err instanceof ApiRequestError) {
    if (err.status === 501) return notImplementedHint
    const body = err.body as { error?: { message?: string } } | undefined
    return body?.error?.message ?? `Request failed (${err.status}).`
  }
  return "Could not reach the API. Set NEXT_PUBLIC_API_URL and run @landshoppers/api."
}
