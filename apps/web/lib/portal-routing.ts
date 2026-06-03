import type { AuthRole } from "@/lib/api/auth"

const PORTAL_PREFIX_BY_ROLE: Record<string, string> = {
  buyer: "/buyer",
  agent: "/agent",
  developer: "/developer",
  admin: "/admin",
  super_admin: "/admin",
  service_provider: "/provider",
}

const PORTAL_PREFIXES = ["/buyer", "/agent", "/developer", "/admin", "/provider"] as const

/** Decode JWT payload role (routing hint only — API still enforces auth). */
export function decodeAccessTokenRole(token: string): AuthRole | undefined {
  const parts = token.split(".")
  if (parts.length !== 3) return undefined
  try {
    const b64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/")
    const pad = b64.length % 4 === 0 ? b64 : b64 + "=".repeat(4 - (b64.length % 4))
    const json =
      typeof atob === "function"
        ? atob(pad)
        : Buffer.from(pad, "base64").toString("utf8")
    const payload = JSON.parse(json) as { role?: unknown }
    return typeof payload.role === "string" ? (payload.role as AuthRole) : undefined
  } catch {
    return undefined
  }
}

export function portalPrefixForRole(role: string | undefined): string | null {
  if (!role) return null
  return PORTAL_PREFIX_BY_ROLE[role] ?? null
}

export function pathnamePortalPrefix(pathname: string): string | null {
  for (const prefix of PORTAL_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return prefix
    }
  }
  return null
}

/**
 * When the signed-in role does not match the dashboard URL prefix, return the
 * correct portal home (e.g. agent on `/buyer` → `/agent`).
 */
export function portalMismatchRedirect(pathname: string, role: string | undefined): string | null {
  const expected = portalPrefixForRole(role)
  const actual = pathnamePortalPrefix(pathname)
  if (!expected || !actual || expected === actual) return null
  return expected
}
