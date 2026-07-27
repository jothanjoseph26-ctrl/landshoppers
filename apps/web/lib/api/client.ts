import { refreshAccessTokenSingleFlight } from "./auth-refresh"
import { authAuthorizationHeader } from "./auth-session"
import { getPublicApiBaseUrl } from "./config"
import type { ApiErrorBody } from "./types"

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody | unknown,
  ) {
    super(`API request failed (${status})`)
    this.name = "ApiRequestError"
  }
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: Record<string, unknown>
  /** Attach `Authorization: Bearer` from session when tokens exist (Agent 2). */
  auth?: boolean
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body: jsonBody, auth: useAuth, ...rest } = options
  const base = getPublicApiBaseUrl()
  const url = buildApiUrl(base, path)

  const buildHeaders = () => {
    const headers = new Headers(rest.headers)
    if (jsonBody !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
    if (useAuth) {
      const extra = authAuthorizationHeader()
      for (const [k, v] of Object.entries(extra)) {
        headers.set(k, v)
      }
    }
    return headers
  }

  const request = (requestUrl: string) =>
    fetch(requestUrl, {
      ...rest,
      headers: buildHeaders(),
      body: jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined,
    })

  let requestUrl = url
  let res: Response
  try {
    res = await request(requestUrl)
  } catch (err) {
    const fallbackUrl = sameOriginApiFallbackUrl(base, path)
    if (!fallbackUrl) throw err
    requestUrl = fallbackUrl
    res = await request(requestUrl)
  }
  let text = await res.text()
  let json: unknown = null
  try {
    json = text ? (JSON.parse(text) as unknown) : null
  } catch {
    json = null
  }

  if (!res.ok && useAuth && res.status === 401 && (await refreshAccessTokenSingleFlight())) {
    res = await request(requestUrl)
    text = await res.text()
    try {
      json = text ? (JSON.parse(text) as unknown) : null
    } catch {
      json = null
    }
  }

  if (!res.ok) {
    throw new ApiRequestError(res.status, json)
  }

  return json as T
}

function buildApiUrl(base: string, path: string): string {
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`
}

function sameOriginApiFallbackUrl(base: string, path: string): string | null {
  if (path.startsWith("http") || typeof window === "undefined") return null
  if (base.startsWith("/")) return null

  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  try {
    const configured = new URL(base)
    if (configured.origin === window.location.origin) return null
    return `${window.location.origin}/api${normalizedPath}`
  } catch {
    return `/api${normalizedPath}`
  }
}
