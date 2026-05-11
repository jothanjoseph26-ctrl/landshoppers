/** Browser + server: point at `@landshoppers/api` (default local Agent 2 port). */
export function getPublicApiBaseUrl(): string {
  const raw = process.env["NEXT_PUBLIC_API_URL"]
  if (raw && raw.length > 0) {
    return normalizeApiBaseUrl(raw)
  }
  return "http://localhost:4001"
}

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "")
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(trimmed)) {
    return `http://${trimmed}`
  }
  return `https://${trimmed}`
}
