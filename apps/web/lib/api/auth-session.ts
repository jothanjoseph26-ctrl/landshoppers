const ACCESS = "ls_access_token"
const REFRESH = "ls_refresh_token"

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const prefix = `${name}=`
  const parts = document.cookie.split("; ")
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      const raw = part.slice(prefix.length)
      try {
        return decodeURIComponent(raw)
      } catch {
        return raw
      }
    }
  }
  return null
}

/**
 * Access token lives in `sessionStorage` for API `Authorization` headers.
 * `sessionStorage` is **not** shared across tabs, but login already mirrors the
 * access JWT to `ls_access_token` (cookie). Hydrate from the cookie so new tabs
 * and hard refreshes still send `Bearer` until we move to httpOnly cookies.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  const fromSession = sessionStorage.getItem(ACCESS)
  if (fromSession) return fromSession
  const fromCookie = readCookie(ACCESS)
  if (fromCookie) {
    sessionStorage.setItem(ACCESS, fromCookie)
    return fromCookie
  }
  return null
}

/** Same tab / cookie pattern as {@link getAccessToken} — refresh is mirrored to a cookie on login. */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  const fromSession = sessionStorage.getItem(REFRESH)
  if (fromSession) return fromSession
  const fromCookie = readCookie(REFRESH)
  if (fromCookie) {
    sessionStorage.setItem(REFRESH, fromCookie)
    return fromCookie
  }
  return null
}

/**
 * Stores tokens and mirrors access token to a lightweight cookie so `middleware.ts`
 * can gate `/developer/*` when `NEXT_PUBLIC_PORTAL_GUARD=true`.
 */
export function persistAuthSession(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(ACCESS, accessToken)
  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `${ACCESS}=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  if (refreshToken) {
    sessionStorage.setItem(REFRESH, refreshToken)
    document.cookie = `${REFRESH}=${encodeURIComponent(refreshToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(ACCESS)
  sessionStorage.removeItem(REFRESH)
  document.cookie = `${ACCESS}=; Path=/; Max-Age=0`
  document.cookie = `${REFRESH}=; Path=/; Max-Age=0`
}

export function authAuthorizationHeader(): Record<string, string> {
  const t = getAccessToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}
