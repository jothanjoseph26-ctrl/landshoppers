import { getPublicApiBaseUrl } from "./config"
import { ApiRequestError } from "./client"

/** Next.js RSC `fetch` with JSON parsing (cached via `next.revalidate`). */
export async function apiFetchServer<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number | false } },
): Promise<T> {
  const base = getPublicApiBaseUrl()
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  })
  const text = await res.text()
  const json = text ? (JSON.parse(text) as unknown) : null
  if (!res.ok) {
    throw new ApiRequestError(res.status, json)
  }
  return json as T
}
