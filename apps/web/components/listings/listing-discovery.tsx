'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Grid3X3, List, Map, LayoutPanelLeft } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PropertyCard } from '@/components/listings/property-card'
import { ListingFilters, type FilterState } from '@/components/listings/listing-filters'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import type { ApiListResponse, ApiListing } from '@/lib/api/types'
import { apiFetch } from '@/lib/api/client'
import { mapApiListingToCardProps } from '@/lib/listings/map-api-listing'
import {
  buildDiscoveryPath,
  parseDiscoverySearchParams,
  DEFAULT_VIEW,
  type DiscoveryView,
} from '@/lib/listings/discovery-url'
import {
  buildSearchListingsQuery,
  buildSearchMapQuery,
} from '@/lib/listings/build-listings-api-query'
import type { ListingMapFeature } from '@/components/listings/listing-map-panel'

const ListingMapPanel = dynamic(
  () =>
    import('@/components/listings/listing-map-panel').then((m) => ({
      default: m.ListingMapPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[min(70vh,640px)] min-h-[280px] animate-pulse rounded-lg border bg-muted" />
    ),
  },
)

function matchesAmenityFilter(_row: ApiListing, amenities: string[]): boolean {
  if (amenities.length === 0) return true
  return true
}

export function ListingDiscovery() {
  return (
    <Suspense fallback={<DiscoveryFallback />}>
      <ListingDiscoveryInner />
    </Suspense>
  )
}

function DiscoveryFallback() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export function ListingDiscoveryInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { filters, page, view } = useMemo(
    () => parseDiscoverySearchParams(searchParams),
    [searchParams],
  )

  const [rows, setRows] = useState<ApiListing[]>([])
  const [meta, setMeta] = useState<ApiListResponse<ApiListing[]>['meta']>()
  const [mapFeatures, setMapFeatures] = useState<ListingMapFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list')

  const pageSize = 12

  const filteredRows = rows.filter((row) =>
    matchesAmenityFilter(row, filters.amenities),
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setFetchError(null)
      try {
        const qs = buildSearchListingsQuery(filters, page, pageSize)
        const res = await apiFetch<ApiListResponse<ApiListing[]>>(
          `/v1/search/listings?${qs}`,
        )
        if (cancelled) return
        setRows(res.data)
        setMeta(res.meta)
      } catch {
        if (!cancelled) {
          setFetchError(
            'Could not load listings. Ensure Postgres/API are running and NEXT_PUBLIC_API_URL is set.',
          )
          setRows([])
          setMeta(undefined)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    if (view !== 'split') {
      setMapFeatures([])
      return
    }
    let cancelled = false
    async function loadMap() {
      setMapLoading(true)
      try {
        const mq = buildSearchMapQuery(filters, 500)
        const res = await apiFetch<ApiListResponse<GeoJSON.FeatureCollection>>(
          `/v1/search/map?${mq}`,
        )
        const feats = ((res.data as GeoJSON.FeatureCollection).features ??
          []) as ListingMapFeature[]
        if (!cancelled) setMapFeatures(feats)
      } catch {
        if (!cancelled) setMapFeatures([])
      } finally {
        if (!cancelled) setMapLoading(false)
      }
    }
    void loadMap()
    return () => {
      cancelled = true
    }
  }, [filters, view])

  const pushFilters = (next: FilterState, resetPage = true) =>
    router.replace(
      buildDiscoveryPath(pathname, next, resetPage ? 1 : page, view),
    )

  const gridClasses =
    view === 'list'
      ? 'grid grid-cols-1 gap-4'
      : view === 'split'
        ? 'grid gap-4 sm:grid-cols-2'
        : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

  const totalForDisplay = loading
    ? 0
    : (meta?.total ?? filteredRows.length)
  const totalPages = Math.max(1, meta?.totalPages ?? 1)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Property listings</h1>
            <p className="mt-1 text-muted-foreground">
              Filters update the URL for sharing — open split view for a map beside results (desktop).
            </p>
          </header>

          <ListingFilters
            filters={filters}
            onFiltersChange={(nf) => pushFilters(nf)}
            totalResults={totalForDisplay}
          />

          {fetchError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {fetchError}{' '}
              <button
                type="button"
                className="underline"
                onClick={() => router.refresh()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Desktop layout controls */}
          <div className="mt-6 hidden flex-wrap items-center justify-end gap-2 lg:flex">
            <span className="mr-2 text-sm text-muted-foreground">Layout</span>
            <div className="inline-flex rounded-lg bg-muted p-1">
              {(
                [
                  ['grid', Grid3X3, 'Grid'],
                  ['list', List, 'List'],
                  ['split', LayoutPanelLeft, 'Split + map'],
                ] as const
              ).map(([v, Icon, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    router.replace(buildDiscoveryPath(pathname, filters, 1, v))
                  }
                  className={cn(
                    'flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-all',
                    view === v
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {view === 'split' && (
            <div className="mt-4 flex rounded-lg bg-muted p-1 lg:hidden">
              <button
                type="button"
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium',
                  mobileTab === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                )}
                onClick={() => setMobileTab('list')}
              >
                <List className="h-4 w-4" /> List
              </button>
              <button
                type="button"
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium',
                  mobileTab === 'map'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground',
                )}
                onClick={() => setMobileTab('map')}
              >
                <Map className="h-4 w-4" /> Map
              </button>
            </div>
          )}

          <div
            className={cn(
              'mt-6 gap-6 lg:gap-8',
              view === 'split' ? 'lg:grid lg:grid-cols-[1fr,minmax(300px,40%)]' : '',
            )}
          >
            <section
              className={cn(
                view === 'split'
                  ? mobileTab === 'map'
                    ? 'hidden lg:block'
                    : ''
                  : '',
              )}
            >
              {loading ? (
                <div className={gridClasses}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-72 animate-pulse rounded-xl border bg-card" />
                  ))}
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="rounded-xl bg-background py-16 text-center shadow-sm">
                  <p className="text-lg font-medium">Nothing matches yet</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Try widening price or clearing location — URLs keep your search reproducible.
                  </p>
                  <Button
                    className="mt-6"
                    variant="outline"
                    onClick={() =>
                      router.replace(
                        buildDiscoveryPath(pathname, CLEAR_FILTERS, 1, view),
                      )
                    }
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className={gridClasses}>
                    {filteredRows.map((row) => {
                      const c = mapApiListingToCardProps(row)
                      const active = selectedId === c.id
                      return (
                        <div
                          key={c.id}
                          role="link"
                          tabIndex={0}
                          className={cn(
                            'cursor-pointer rounded-xl outline-none transition-shadow',
                            active && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                          )}
                          onClick={() => setSelectedId(c.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedId(c.id)
                            }
                          }}
                        >
                          <PropertyCard {...c} />
                        </div>
                      )
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                if (page > 1) {
                                  router.replace(
                                    buildDiscoveryPath(
                                      pathname,
                                      filters,
                                      page - 1,
                                      view,
                                    ),
                                  )
                                }
                              }}
                              className={
                                page <= 1 ? 'pointer-events-none opacity-40' : ''
                              }
                            />
                          </PaginationItem>
                          {buildPageWindow(page, totalPages).map((pNum, idx, arr) => (
                            <PaginationItem key={`${pNum}-${idx}`}>
                              {pNum === 'ellipsis' ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  href="#"
                                  isActive={page === pNum}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    router.replace(
                                      buildDiscoveryPath(
                                        pathname,
                                        filters,
                                        pNum as number,
                                        view,
                                      ),
                                    )
                                  }}
                                >
                                  {pNum}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                if (page < totalPages) {
                                  router.replace(
                                    buildDiscoveryPath(
                                      pathname,
                                      filters,
                                      page + 1,
                                      view,
                                    ),
                                  )
                                }
                              }}
                              className={
                                page >= totalPages
                                  ? 'pointer-events-none opacity-40'
                                  : ''
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </section>

            {view === 'split' && (
              <aside
                className={cn(
                  mobileTab === 'list' ? 'hidden lg:block' : 'block',
                )}
              >
                {mapLoading && (
                  <p className="mb-2 text-xs text-muted-foreground">Loading map…</p>
                )}
                <ListingMapPanel
                  features={mapFeatures}
                  selectedId={selectedId}
                  onSelectPin={(id) => setSelectedId(id)}
                />
              </aside>
            )}
          </div>

          {view !== 'split' && (
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Want a map? Switch to{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() =>
                  router.replace(
                    buildDiscoveryPath(pathname, filters, page, 'split'),
                  )
                }
              >
                split view
              </button>
              .
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

const CLEAR_FILTERS: FilterState = {
  location: '',
  type: 'all',
  propertyType: 'all',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  bathrooms: '',
  amenities: [],
  sortBy: 'newest',
}

function buildPageWindow(
  current: number,
  total: number,
): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('ellipsis')
    out.push(p)
    prev = p
  }
  return out
}
