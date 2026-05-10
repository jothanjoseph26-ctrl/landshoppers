const ACCESS = "ls_access_token"
const REFRESH = "ls_refresh_token"

/** Browser-only session keys (upgrade to httpOnly cookies when Agent 2 ships refresh flow). */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(ACCESS)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(REFRESH)
}

/**
 * Stores tokens and mirrors access token to a lightweight cookie so `middleware.ts`
 * can gate `/developer/*` when `NEXT_PUBLIC_PORTAL_GUARD=true`.
 */
export function persistAuthSession(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(ACCESS, accessToken)
  if (refreshToken) sessionStorage.setItem(REFRESH, refreshToken)
  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `${ACCESS}=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(ACCESS)
  sessionStorage.removeItem(REFRESH)
  document.cookie = `${ACCESS}=; Path=/; Max-Age=0`
}

export function authAuthorizationHeader(): Record<string, string> {
  const t = getAccessToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}
