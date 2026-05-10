const LS_COMPARE = 'landshoppers_compare_listings'
const LS_SAVE = 'landshoppers_saved_listings'
const MAX_COMPARE = 4

export function readCompareIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_COMPARE)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string').slice(0, MAX_COMPARE) : []
  } catch {
    return []
  }
}

export function toggleCompareListing(id: string, selected: boolean): string[] {
  if (typeof window === 'undefined') return []
  const cur = new Set(readCompareIds())
  if (selected) cur.add(id)
  else cur.delete(id)
  const next = [...cur].slice(0, MAX_COMPARE)
  window.localStorage.setItem(LS_COMPARE, JSON.stringify(next))
  return next
}

export function readSavedListingIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_SAVE)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function toggleSavedListing(id: string, saved: boolean): string[] {
  if (typeof window === 'undefined') return []
  const cur = new Set(readSavedListingIds())
  if (saved) cur.add(id)
  else cur.delete(id)
  const next = [...cur]
  window.localStorage.setItem(LS_SAVE, JSON.stringify(next))
  return next
}

export function savedCount(): number {
  return readSavedListingIds().length
}
