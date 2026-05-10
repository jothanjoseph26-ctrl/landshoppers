/** Naira formatter using kobo-precision strings (matches API contract). */
export function formatKoboNaira(koboValue: string | bigint | number): string {
  const raw = typeof koboValue === "bigint" ? koboValue.toString() : String(koboValue)
  const digits = raw.replace(/[^0-9-]/g, "") || "0"
  const naira = Number(digits) / 100
  if (naira >= 1_000_000_000) {
    return `\u20A6${(naira / 1_000_000_000).toFixed(naira % 1_000_000_000 === 0 ? 0 : 2)}B`
  }
  if (naira >= 1_000_000) {
    return `\u20A6${(naira / 1_000_000).toFixed(naira % 1_000_000 === 0 ? 0 : 1)}M`
  }
  return `\u20A6${naira.toLocaleString()}`
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const diffMs = Date.now() - d.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}
