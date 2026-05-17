import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ServiceHubDirectoryResults } from "@/components/servicehub/servicehub-directory-results"
import { ServiceHubProviderProfile } from "@/components/servicehub/servicehub-provider-profile"
import { Button } from "@/components/ui/button"
import {
  DEMO_SERVICE_PROVIDERS,
  normalizeServiceProviderFromApi,
  tryFetchServiceProviderBySlug,
  tryFetchServiceReviews,
  tryFetchServiceProviders,
  type ApiServiceProviderListItem,
} from "@/lib/api/services-marketplace"
import {
  getServiceHubCategoryMeta,
  isServiceHubCategorySlug,
  type ServiceHubCategorySlug,
} from "@/lib/servicehub/categories"
import {
  isServiceDirectoryGeoSlug,
  SERVICE_DIRECTORY_GEO,
} from "@/lib/servicehub/geo"
import { ServiceHubDirectoryControls } from "../servicehub-directory-controls"

export const revalidate = 60

type SearchParams = {
  keyword?: string
  sort?: string
  view?: string
  listingId?: string
  source?: string
}

type PageProps = {
  params: Promise<{ category: string; segment: string }>
  searchParams?: Promise<SearchParams>
}

function sortKey(s: string | undefined): "rating" | "jobs" | "newest" | "recommended" | "response" {
  switch (s) {
    case "jobs":
      return "jobs"
    case "newest":
      return "newest"
    case "response":
      return "response"
    case "recommended":
      return "recommended"
    default:
      return "rating"
  }
}

function sortDemoProviders(
  items: ApiServiceProviderListItem[],
  sort: string | undefined,
): ApiServiceProviderListItem[] {
  const copy = [...items]
  switch (sort) {
    case "jobs":
      return copy.sort((a, b) => (b.completedJobCount ?? 0) - (a.completedJobCount ?? 0))
    case "newest":
      return copy
    case "response":
    case "recommended":
      return copy.sort((a, b) => b.rating - a.rating)
    default:
      return copy.sort((a, b) => b.rating - a.rating)
  }
}

function demoFilterGeo(
  items: ApiServiceProviderListItem[],
  category: string,
  geoLabel: string,
  keyword?: string,
): ApiServiceProviderListItem[] {
  const g = geoLabel.toLowerCase()
  let rows = items.filter((p) => p.category === category)
  rows = rows.filter(
    (p) =>
      p.state.toLowerCase().includes(g) ||
      p.city.toLowerCase().includes(g) ||
      (p.serviceAreas ?? []).some((a) => a.toLowerCase().includes(g)),
  )
  if (keyword) {
    const q = keyword.toLowerCase()
    rows = rows.filter(
      (p) =>
        p.businessName.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    )
  }
  return rows
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, segment } = await params
  if (!isServiceHubCategorySlug(category)) {
    return { title: "Services" }
  }
  const meta = getServiceHubCategoryMeta(category)
  if (isServiceDirectoryGeoSlug(segment)) {
    const place = SERVICE_DIRECTORY_GEO[segment]
    return {
      title: `${meta?.label ?? category} in ${place} | LandShoppers`,
      description: `Find verified ${(meta?.label ?? category).toLowerCase()} professionals in ${place}.`,
    }
  }
  const apiPayload = await tryFetchServiceProviderBySlug(segment)
  let businessName = segment.replace(/-/g, " ")
  let description = `Verified ${(meta?.label ?? category).toLowerCase()} professional on LandShoppers ServiceHub.`
  if (apiPayload && typeof apiPayload === "object") {
    const root = apiPayload as Record<string, unknown>
    const doc =
      root["provider"] && typeof root["provider"] === "object"
        ? (root["provider"] as Record<string, unknown>)
        : root["profile"] && typeof root["profile"] === "object"
          ? (root["profile"] as Record<string, unknown>)
          : root
    const n = normalizeServiceProviderFromApi(doc)
    if (n) {
      businessName = n.businessName
      if (n.description) description = n.description.slice(0, 160)
    }
  }
  const catLabel = meta?.label ?? category
  const canonical = `/services/${category}/${segment}`
  return {
    title: `${businessName} | ${catLabel} | ServiceHub`,
    description,
    openGraph: {
      title: `${businessName} | ${catLabel} | ServiceHub`,
      description,
    },
    alternates: { canonical },
  }
}

export default async function ServiceSegmentPage({ params, searchParams }: PageProps) {
  const { category, segment } = await params
  const sp = (await searchParams) ?? {}
  if (!isServiceHubCategorySlug(category)) notFound()

  if (isServiceDirectoryGeoSlug(segment)) {
    const place = SERVICE_DIRECTORY_GEO[segment]
    const apiSort = sortKey(sp.sort)
    const listJson = await tryFetchServiceProviders({
      category,
      state: place,
      keyword: sp.keyword,
      sort: apiSort,
      limit: 60,
    })
    let providers =
      listJson?.items && listJson.items.length > 0 ? listJson.items : DEMO_SERVICE_PROVIDERS
    if (!listJson?.items?.length) {
      providers = demoFilterGeo(providers, category, place, sp.keyword)
      providers = sortDemoProviders(providers, sp.sort)
    }

    const meta = getServiceHubCategoryMeta(category)!
    const sortClient = sp.sort ?? "rating"
    const view = sp.view === "map" ? "map" : "list"

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/services" className="hover:text-foreground">
                Services
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/services/${category}`} className="hover:text-foreground">
                {meta.label}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">{place}</span>
            </nav>
          </div>
        </div>

        <section className="border-b bg-primary/5 py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {meta.label} — {place}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Crawlable directory URL for high-intent local search. Filters apply to verified
              providers recorded in Lagos and surrounding service areas.
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <p className="mb-6 text-muted-foreground">
              <span className="font-semibold text-foreground">{providers.length}</span> providers
              found
            </p>
            <ServiceHubDirectoryControls
              category={category}
              sort={sortClient}
              view={view}
              geoSlug={segment}
            />
            <ServiceHubDirectoryResults
              providers={providers}
              view={view}
              category={category}
              emptyTitle="No providers match this area yet"
              emptyDescription="Expand to nearby LGAs or list your practice to appear here."
              emptyCtaHref="/services/join"
              emptyCtaLabel="Become a provider"
            />
            <p className="mx-auto mt-10 max-w-3xl text-sm text-muted-foreground">
              Find verified {meta.shortLabel.toLowerCase()} professionals in {place}. LandShoppers
              ServiceHub connects transaction-ready users with professionals who carry documentation,
              reviews, and completed jobs on platform.
            </p>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  const [apiPayload, reviewsRes] = await Promise.all([
    tryFetchServiceProviderBySlug(segment),
    tryFetchServiceReviews(segment, { limit: 12 }),
  ])

  let provider: ApiServiceProviderListItem | undefined = DEMO_SERVICE_PROVIDERS.find(
    (p) => p.slug === segment,
  )

  if (apiPayload && typeof apiPayload === "object") {
    const root = apiPayload as Record<string, unknown>
    const doc =
      root["provider"] && typeof root["provider"] === "object"
        ? (root["provider"] as Record<string, unknown>)
        : root["profile"] && typeof root["profile"] === "object"
          ? (root["profile"] as Record<string, unknown>)
          : root
    const n = normalizeServiceProviderFromApi(doc)
    if (n) provider = n
  }

  if (!provider) notFound()

  if (provider.category !== category) {
    redirect(`/services/${provider.category}/${provider.slug}`)
  }

  let quoteSource: "listing_page" | "directory" | "contextual_match" = "directory"
  if (sp.source === "contextual") quoteSource = "contextual_match"
  else if (sp.source === "listing_page") quoteSource = "listing_page"

  const reviewsApi = reviewsRes?.items?.length ? reviewsRes.items : null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ServiceHubProviderProfile
        categorySlug={category as ServiceHubCategorySlug}
        provider={provider}
        listingId={sp.listingId}
        quoteSource={quoteSource}
        reviewsApi={reviewsApi}
      />
      <Footer />
    </div>
  )
}
