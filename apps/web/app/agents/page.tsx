'use client'

import { useState, useMemo, useEffect } from 'react'
import { Loader2, Search, MapPin, SlidersHorizontal } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AgentCard, type AgentCardProps } from '@/components/agents/agent-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import type { ApiAgentSummary, ApiListResponse } from '@/lib/api/types'
import { apiFetch } from '@/lib/api/client'

function toAgentCard(a: ApiAgentSummary): AgentCardProps {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    company: a.company || undefined,
    image: a.image,
    phone: a.phone,
    whatsapp: a.whatsapp,
    city: a.city,
    specializations: a.specializations,
    isVerified: a.isVerified,
    rating: a.rating,
    reviewCount: a.reviewCount,
    totalListings: a.totalListings,
    totalSales: a.totalSales,
    yearsOfExperience: a.yearsOfExperience ?? undefined,
  }
}

const cities = ['All Cities', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu']
const specializations = [
  'All Specializations',
  'Luxury Homes',
  'Apartments',
  'Commercial',
  'Land',
  'Investment Properties',
  'New Developments',
  'Rentals',
]

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selectedCity, setSelectedCity] = useState('All Cities')
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Specializations')
  const [sortBy, setSortBy] = useState('rating')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [sourceAgents, setSourceAgents] = useState<AgentCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setFetchError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('pageSize', '50')
        if (debouncedQ) params.set('q', debouncedQ)
        if (selectedCity !== 'All Cities') params.set('city', selectedCity)
        const res = await apiFetch<ApiListResponse<ApiAgentSummary[]>>(
          `/v1/agents?${params}`,
        )
        if (!cancelled) setSourceAgents(res.data.map(toAgentCard))
      } catch {
        if (!cancelled) {
          setFetchError('Could not load agents. Please try again.')
          setSourceAgents([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [debouncedQ, selectedCity, reloadToken])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedQ, selectedCity, selectedSpecialization])

  const filteredAgents = useMemo(() => {
    let result = [...sourceAgents]

    if (selectedSpecialization !== 'All Specializations') {
      result = result.filter((agent) =>
        agent.specializations.includes(selectedSpecialization),
      )
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'reviews':
        result.sort((a, b) => b.reviewCount - a.reviewCount)
        break
      case 'listings':
        result.sort((a, b) => b.totalListings - a.totalListings)
        break
      case 'sales':
        result.sort((a, b) => b.totalSales - a.totalSales)
        break
    }

    return result
  }, [sourceAgents, selectedSpecialization, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage)
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30">
        {/* Hero Section */}
        <section className="bg-primary py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
            <h1 className="text-3xl font-bold text-primary-foreground lg:text-4xl">
              Find Verified Real Estate Agents
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Connect with trusted agents who can help you buy, sell, or rent properties in Nigeria
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-8 max-w-2xl">
              <div className="flex flex-col gap-3 rounded-xl bg-background p-4 shadow-lg sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by agent name or company..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-12 border-0 bg-muted/50 pl-10 text-base shadow-none focus-visible:ring-0"
                  />
                </div>
                <Select
                  value={selectedCity}
                  onValueChange={(value) => {
                    setSelectedCity(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-12 w-full border-0 bg-muted/50 shadow-none sm:w-[160px]">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Filters Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {filteredAgents.length}
              </span>{' '}
              verified agents found
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={selectedSpecialization}
                onValueChange={(value) => {
                  setSelectedSpecialization(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="listings">Most Listings</SelectItem>
                  <SelectItem value="sales">Most Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agents Grid */}
          <div className="mt-8">
            {fetchError ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-background py-16">
                <p className="text-center text-muted-foreground">{fetchError}</p>
                <Button
                  variant="outline"
                  className="mt-6"
                  type="button"
                  onClick={() => setReloadToken((n) => n + 1)}
                >
                  Retry
                </Button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-background py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Loading agents…
                </p>
              </div>
            ) : paginatedAgents.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedAgents.map((agent) => (
                    <AgentCard key={agent.id} {...agent} />
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

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          (page) => (
                            <PaginationItem key={page}>
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
                        )}

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
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  No agents found
                </h3>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCity('All Cities')
                    setSelectedSpecialization('All Specializations')
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>

          {/* Become an Agent CTA */}
          <section className="mt-16 rounded-2xl bg-primary p-8 text-center lg:p-12">
            <h2 className="text-2xl font-bold text-primary-foreground lg:text-3xl">
              Are You a Real Estate Agent?
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Join LandShoppers and connect with thousands of buyers looking for properties
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-6"
              asChild
            >
              <a href="/for-agents">Join as Agent</a>
            </Button>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
