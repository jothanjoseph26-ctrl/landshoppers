'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Grid3X3, Map, List } from 'lucide-react'
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
import type { PropertyCardProps } from '@/components/listings/property-card'
import { mapApiListingToCardProps } from '@/lib/listings/map-api-listing'

type ViewMode = 'grid' | 'list' | 'map'

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsPageFallback />}>
      <ListingsPageContent />
    </Suspense>
  )
}

function ListingsPageFallback() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded-md bg-muted" />
        </div>
      </main>
      <Footer />
    </>
  )
}

function ListingsPageContent() {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9
  const [sourceRows, setSourceRows] = useState<PropertyCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>(() => ({
    location: searchParams.get('location') || '',
    type: (searchParams.get('type') as 'sale' | 'rent' | 'all') || 'all',
    propertyType: searchParams.get('propertyType') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    bathrooms: searchParams.get('bathrooms') || '',
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || [],
    sortBy: searchParams.get('sortBy') || 'newest',
  }))

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setFetchError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('pageSize', '150')
        const q = filters.location.trim()
        if (q) params.set('q', q)
        if (filters.minPrice)
          params.set(
            'minPrice',
            (BigInt(filters.minPrice) * BigInt(100)).toString(),
          )
        if (filters.maxPrice)
          params.set(
            'maxPrice',
            (BigInt(filters.maxPrice) * BigInt(100)).toString(),
          )

        const res = await apiFetch<ApiListResponse<ApiListing[]>>(
          `/v1/search?${params.toString()}`,
        )
        if (cancelled) return
        setSourceRows(res.data.map(mapApiListingToCardProps))
      } catch {
        if (!cancelled) {
          setFetchError(
            'Could not load listings. Ensure Postgres is running, `@landshoppers/api` is up, and `NEXT_PUBLIC_API_URL` points to it.',
          )
          setSourceRows([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [filters.location, filters.minPrice, filters.maxPrice])

  // Client-side refine (API search MVP does not cover every filter yet)
  const filteredListings = useMemo(() => {
    let result = [...sourceRows]

    if (filters.type !== 'all') {
      result = result.filter((listing) => listing.type === filters.type)
    }

    if (filters.propertyType !== 'all') {
      result = result.filter(
        (listing) => listing.propertyType === filters.propertyType,
      )
    }

    if (filters.minPrice) {
      const min = parseInt(filters.minPrice, 10)
      result = result.filter((listing) => listing.price >= min)
    }

    if (filters.maxPrice) {
      const max = parseInt(filters.maxPrice, 10)
      result = result.filter((listing) => listing.price <= max)
    }

    if (filters.bedrooms) {
      const n = parseInt(filters.bedrooms, 10)
      result = result.filter(
        (listing) =>
          listing.bedrooms !== undefined && listing.bedrooms >= n,
      )
    }

    if (filters.bathrooms) {
      const n = parseInt(filters.bathrooms, 10)
      result = result.filter(
        (listing) =>
          listing.bathrooms !== undefined && listing.bathrooms >= n,
      )
    }

    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        result.sort(
          (a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0),
        )
        break
      case 'newest':
      default:
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
    }

    return result
  }, [filters, sourceRows])

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage)
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Property Listings
            </h1>
            <p className="mt-2 text-muted-foreground">
              Find your perfect property from our verified listings
            </p>
          </div>

          {/* Filters */}
          <ListingFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters)
              setCurrentPage(1) // Reset to first page on filter change
            }}
            totalResults={filteredListings.length}
          />

          {fetchError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {fetchError}
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="mt-6 flex items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="inline-flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-md p-2 transition-all',
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-md p-2 transition-all',
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
                <span className="sr-only">List view</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'rounded-md p-2 transition-all',
                  viewMode === 'map'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Map className="h-4 w-4" />
                <span className="sr-only">Map view</span>
              </button>
            </div>
          </div>

          {/* Listings Grid/List */}
          <div className="mt-6">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl border bg-card shadow-md"
                  >
                    <div className="aspect-[4/3] animate-pulse bg-muted" />
                    <div className="space-y-3 p-4">
                      <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
                      <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedListings.length > 0 ? (
              <>
                <div
                  className={cn(
                    'grid gap-6',
                    viewMode === 'grid'
                      ? 'sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1'
                  )}
                >
                  {paginatedListings.map((listing) => (
                    <PropertyCard
                      key={listing.id}
                      {...listing}
                      className={viewMode === 'list' ? 'sm:flex-row' : ''}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }}
                            className={
                              currentPage === 1
                                ? 'pointer-events-none opacity-50'
                                : ''
                            }
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            if (totalPages <= 5) return true
                            if (page === 1 || page === totalPages) return true
                            if (Math.abs(page - currentPage) <= 1) return true
                            return false
                          })
                          .map((page, index, arr) => {
                            const prevPage = arr[index - 1]
                            const showEllipsis =
                              prevPage && page - prevPage > 1

                            return (
                              <PaginationItem key={page}>
                                {showEllipsis && (
                                  <PaginationEllipsis className="mr-2" />
                                )}
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(page)
                                  }}
                                  isActive={currentPage === page}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }}
                            className={
                              currentPage === totalPages
                                ? 'pointer-events-none opacity-50'
                                : ''
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl bg-background py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Map className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  No properties found
                </h3>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Try adjusting your filters or search in a different location
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() =>
                    setFilters({
                      location: '',
                      type: 'all',
                      propertyType: 'all',
                      minPrice: '',
                      maxPrice: '',
                      bedrooms: '',
                      bathrooms: '',
                      amenities: [],
                      sortBy: 'newest',
                    })
                  }
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
