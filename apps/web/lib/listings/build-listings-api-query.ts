import type { FilterState } from '@/components/listings/listing-filters'

/** Query string for GET `/v1/search/listings` (prices converted Naira → kobo). */
export function buildSearchListingsQuery(
  filters: FilterState,
  page: number,
  pageSize: number,
): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  params.set('backend', 'auto')
  params.set('facets', 'true')

  const q = filters.location.trim()
  if (q) params.set('q', q)

  if (filters.type === 'sale') params.set('listingType', 'sale')
  else if (filters.type === 'rent') params.set('listingType', 'rent')

  const minN = sanitizeNaira(filters.minPrice)
  const maxN = sanitizeNaira(filters.maxPrice)
  const listingKobo = BigInt(100)
  if (minN) params.set('minPrice', (BigInt(minN) * listingKobo).toString())
  if (maxN) params.set('maxPrice', (BigInt(maxN) * listingKobo).toString())

  if (filters.propertyType !== 'all')
    params.set('propertyType', filters.propertyType)

  const beds = Number.parseInt(filters.bedrooms, 10)
  if (!Number.isNaN(beds) && beds > 0) params.set('minBeds', String(beds))

  const baths = Number.parseInt(filters.bathrooms, 10)
  if (!Number.isNaN(baths) && baths > 0) params.set('minBaths', String(baths))

  const sort =
    filters.sortBy === 'price_asc'
      ? 'price_asc'
      : filters.sortBy === 'price_desc'
        ? 'price_desc'
        : 'newest'
  params.set('sort', sort)

  return params.toString()
}

function sanitizeNaira(raw: string): string | null {
  if (!raw || raw === 'any') return null
  return /^\d+$/.test(raw) ? raw : null
}

/** Nigeria-focused viewport for clustered map pins (covers seeded Lagos–Abuja listings). */
export function buildSearchMapQuery(
  filters: FilterState,
  pageSize: number,
): string {
  const params = new URLSearchParams({
    page: '1',
    pageSize: String(pageSize),
    minLng: '2.62',
    minLat: '4.12',
    maxLng: '14.72',
    maxLat: '13.92',
  })

  const minN = sanitizeNaira(filters.minPrice)
  const maxN = sanitizeNaira(filters.maxPrice)
  const mapKobo = BigInt(100)
  if (minN) params.set('minPrice', (BigInt(minN) * mapKobo).toString())
  if (maxN) params.set('maxPrice', (BigInt(maxN) * mapKobo).toString())

  if (filters.type === 'sale') params.set('listingType', 'sale')
  else if (filters.type === 'rent') params.set('listingType', 'rent')

  if (filters.propertyType !== 'all')
    params.set('propertyType', filters.propertyType)

  return params.toString()
}
