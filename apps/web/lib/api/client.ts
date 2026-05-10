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
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`

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

  const res = await fetch(url, {
    ...rest,
    headers,
    body: jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined,
  })

  const text = await res.text()
  const json = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    throw new ApiRequestError(res.status, json)
  }

  return json as T
}
