import { getPublicApiBaseUrl } from "./config"
import { getRefreshToken, persistAuthSession } from "./auth-session"

function applyTokenEnvelope(json: unknown): boolean {
  if (!json || typeof json !== "object") return false
  const data = (json as { data?: unknown }).data
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  const access =
    (typeof d.accessToken === "string" && d.accessToken) ||
    (typeof d.access_token === "string" && d.access_token) ||
    ""
  const refresh =
    (typeof d.refreshToken === "string" && d.refreshToken) ||
    (typeof d.refresh_token === "string" && d.refresh_token) ||
    undefined
  if (!access) return false
  persistAuthSession(access, refresh)
  return true
}

let refreshPromise: Promise<boolean> | null = null

/**
 * Uses stored refresh token to obtain new access (and refresh) tokens.
 * Single-flight so parallel 401s do not spam `/v1/auth/refresh`.
 */
export function refreshAccessTokenSingleFlight(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async (): Promise<boolean> => {
      const refresh = getRefreshToken()
      if (!refresh) return false
      const res = await fetch(`${getPublicApiBaseUrl()}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      })
      const text = await res.text()
      let json: unknown = null
      try {
        json = text ? (JSON.parse(text) as unknown) : null
      } catch {
        return false
      }
      if (!res.ok) return false
      return applyTokenEnvelope(json)
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}
