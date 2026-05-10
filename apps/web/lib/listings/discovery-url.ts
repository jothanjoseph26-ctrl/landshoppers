import type { FilterState } from '@/components/listings/listing-filters'

export type DiscoveryView = 'grid' | 'list' | 'split'

/** Default browsing mode; use `view=split` for map-first discovery. */
export const DEFAULT_VIEW: DiscoveryView = 'grid'

export function parseDiscoverySearchParams(searchParams: URLSearchParams): {
  filters: FilterState
  page: number
  view: DiscoveryView
} {
  const typeRaw = searchParams.get('type')
  const type: FilterState['type'] =
    typeRaw === 'sale' || typeRaw === 'rent' || typeRaw === 'all' ? typeRaw : 'all'

  return {
    filters: {
      location: searchParams.get('location') ?? '',
      type,
      propertyType: searchParams.get('propertyType') ?? 'all',
      minPrice: normalizePriceToken(searchParams.get('minPrice')),
      maxPrice: normalizePriceToken(searchParams.get('maxPrice')),
      bedrooms: searchParams.get('bedrooms') ?? '',
      bathrooms: searchParams.get('bathrooms') ?? '',
      amenities: searchParams.get('amenities')?.split(',').filter(Boolean) ?? [],
      sortBy: searchParams.get('sortBy') ?? 'newest',
    },
    page: Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1),
    view: parseView(searchParams.get('view')),
  }
}

function normalizePriceToken(raw: string | null): string {
  if (!raw || raw === 'any') return ''
  return /^\d+$/.test(raw) ? raw : ''
}

function parseView(raw: string | null): DiscoveryView {
  if (raw === 'grid' || raw === 'list' || raw === 'split') return raw
  if (raw === 'map') return 'split'
  return DEFAULT_VIEW
}

/** Shareable `/listings` URL from discovery state (omit defaults). */
export function buildDiscoveryPath(
  pathname: string,
  filters: FilterState,
  page: number,
  view: DiscoveryView,
): string {
  const p = new URLSearchParams()
  if (filters.location.trim()) p.set('location', filters.location.trim())
  if (filters.type !== 'all') p.set('type', filters.type)
  if (filters.propertyType !== 'all') p.set('propertyType', filters.propertyType)
  if (filters.minPrice) p.set('minPrice', filters.minPrice)
  if (filters.maxPrice) p.set('maxPrice', filters.maxPrice)
  if (filters.bedrooms) p.set('bedrooms', filters.bedrooms)
  if (filters.bathrooms) p.set('bathrooms', filters.bathrooms)
  if (filters.amenities.length > 0) p.set('amenities', filters.amenities.join(','))
  if (filters.sortBy !== 'newest') p.set('sortBy', filters.sortBy)
  if (page > 1) p.set('page', String(page))
  if (view !== DEFAULT_VIEW) p.set('view', view)

  const qs = p.toString()
  return qs ? `${pathname}?${qs}` : pathname
}
