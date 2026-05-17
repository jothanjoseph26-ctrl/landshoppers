import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, Filter } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ServiceHubDirectoryResults } from "@/components/servicehub/servicehub-directory-results"
import { Button } from "@/components/ui/button"
import {
  DEMO_SERVICE_PROVIDERS,
  tryFetchServiceProviders,
  type ApiServiceProviderListItem,
} from "@/lib/api/services-marketplace"
import { getServiceHubCategoryMeta, isServiceHubCategorySlug } from "@/lib/servicehub/categories"
import { ServiceHubDirectoryControls } from "./servicehub-directory-controls"

type SearchParams = {
  keyword?: string
  location?: string
  sort?: string
  view?: string
}

export const revalidate = 60

type PageProps = {
  params: Promise<{ category: string }>
  searchParams: Promise<SearchParams>
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

function demoFilter(
  items: ApiServiceProviderListItem[],
  category: string,
  state?: string,
  keyword?: string,
): ApiServiceProviderListItem[] {
  let rows = items.filter((p) => p.category === category)
  if (state) {
    const st = state.toLowerCase()
    rows = rows.filter(
      (p) =>
        p.state.toLowerCase().includes(st) ||
        p.city.toLowerCase().includes(st) ||
        (p.serviceAreas ?? []).some((a) => a.toLowerCase().includes(st)),
    )
  }
  if (keyword) {
    const q = keyword.toLowerCase()
    rows = rows.filter(
      (p) =>
        p.businessName.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.services ?? []).some((s) => s.toLowerCase().includes(q)),
    )
  }
  return rows
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const meta = isServiceHubCategorySlug(category) ? getServiceHubCategoryMeta(category) : undefined
  const titleBase = meta ? meta.label : "Services"
  return {
    title: `${titleBase} directory | LandShoppers`,
    description: `Browse verified ${titleBase.toLowerCase()} professionals on LandShoppers ServiceHub.`,
  }
}

export default async function ServiceDirectoryCategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params
  const sp = await searchParams
  if (!isServiceHubCategorySlug(category)) notFound()
  const meta = getServiceHubCategoryMeta(category)!
  const apiSort = sortKey(sp.sort)
  const listJson = await tryFetchServiceProviders({
    category,
    keyword: sp.keyword,
    state: sp.location,
    sort: apiSort,
    limit: 60,
  })
  let providers =
    listJson?.items && listJson.items.length > 0 ? listJson.items : DEMO_SERVICE_PROVIDERS
  if (!listJson?.items?.length) {
    providers = sortDemoProviders(
      demoFilter(providers, category, sp.location, sp.keyword),
      sp.sort,
    )
  }

  const sortClient = (sp.sort as string | undefined) ?? "rating"
  const view = sp.view === "map" ? "map" : "list"
  const stateLine = sp.location ? ` · ${sp.location}` : ""

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
            <span className="font-medium text-foreground">{meta.label}</span>
          </nav>
        </div>
      </div>

      <section className="border-b bg-primary/5 py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {meta.label}
            {stateLine}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Compare verified professionals, ratings, and completed jobs. Every listing is built for
            high-intent property transactions.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{providers.length}</span> providers
              found
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/services/${category}/lagos`}>Lagos</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/services/${category}/abuja`}>Abuja</Link>
              </Button>
              <Button variant="outline" size="icon" disabled aria-label="More filters coming soon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ServiceHubDirectoryControls category={category} sort={sortClient} view={view} />

          <ServiceHubDirectoryResults providers={providers} view={view} category={category} />

          <div className="mt-12 max-w-3xl text-sm text-muted-foreground">
            <h2 className="mb-2 font-medium text-foreground">
              Find {meta.shortLabel.toLowerCase()} professionals in Nigeria
            </h2>
            <p>
              LandShoppers ServiceHub helps buyers, agents, and developers hire vetted real estate
              service providers faster — with directory search today and contextual matching on
              listings as the network grows.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
