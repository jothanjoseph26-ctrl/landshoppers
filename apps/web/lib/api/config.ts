/** Browser + server: `@landshoppers/api` base URL. */
export function getPublicApiBaseUrl(): string {
  const raw = process.env["NEXT_PUBLIC_API_URL"]
  if (raw && raw.length > 0) {
    return normalizeApiBaseUrl(raw)
  }

  // Vercel: API runs as Next.js route handlers at /api/* on the same deployment.
  if (process.env["VERCEL"] === "1" || process.env["LANDSHOPPERS_API_SAME_ORIGIN"] === "true") {
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"]?.trim().replace(/\/$/, "")
    if (appUrl) {
      return `${normalizeApiBaseUrl(appUrl)}/api`
    }
    const vercelHost = process.env["VERCEL_URL"]?.trim()
    if (vercelHost) {
      return `https://${vercelHost}/api`
    }
    return "/api"
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
