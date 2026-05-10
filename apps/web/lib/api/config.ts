/** Browser + server: point at `@landshoppers/api` (default local Agent 2 port). */
export function getPublicApiBaseUrl(): string {
  const raw = process.env["NEXT_PUBLIC_API_URL"]
  if (raw && raw.length > 0) {
    return raw.replace(/\/$/, "")
  }
  return "http://localhost:4001"
}
