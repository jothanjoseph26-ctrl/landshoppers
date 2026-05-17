import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ServiceHubFeaturedCarousel } from "@/components/servicehub/servicehub-featured-carousel"
import { ServiceHubHeroSearch } from "@/components/servicehub/servicehub-hero-search"
import {
  ServiceHubHowItWorks,
  ServiceHubJoinCta,
} from "@/components/servicehub/servicehub-marketing-blocks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DEMO_SERVICE_PROVIDERS,
  fetchServiceBundlesPublic,
  mergeCategoryCounts,
  tryFetchServiceProviders,
  tryFetchServicesCategories,
} from "@/lib/api/services-marketplace"
import { SERVICE_HUB_CATEGORIES } from "@/lib/servicehub/categories"
import { SERVICE_DIRECTORY_GEO } from "@/lib/servicehub/geo"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Property services directory | LandShoppers ServiceHub",
  description:
    "Find verified legal, survey, construction, and mortgage professionals for your next property transaction in Nigeria.",
}

export const revalidate = 60

const BUNDLE_TEASER = [
  {
    name: "Lagos Title Perfection Package",
    range: "₦350,000–₦800,000",
    blurb: "Legal, survey, valuation, and consent filing — coordinated for you.",
  },
  {
    name: "New Home Ready Package",
    range: "₦180,000–₦450,000",
    blurb: "Inspection, cleaning, and basic smart-home setup after you close.",
  },
  {
    name: "Listing Launch Package",
    range: "₦120,000–₦280,000",
    blurb: "Photos, virtual tour, drone, and floor plans for new listings.",
  },
]

function formatBundleBand(fromKobo: string, toKobo: string): string {
  try {
    const lo = Number(BigInt(fromKobo)) / 100
    const hi = Number(BigInt(toKobo)) / 100
    const fmt = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    })
    return `${fmt.format(lo)} – ${fmt.format(hi)}`
  } catch {
    return "Price on request"
  }
}

export default async function ServicesHomePage() {
  const [categoriesJson, listJson, apiBundles] = await Promise.all([
    tryFetchServicesCategories(),
    tryFetchServiceProviders({ limit: 48, sort: "rating" }),
    fetchServiceBundlesPublic(),
  ])

  const counts = mergeCategoryCounts(categoriesJson)
  const providers = listJson?.items?.length ? listJson.items : DEMO_SERVICE_PROVIDERS
  const directoryTotal = [...counts.values()].reduce((sum, n) => sum + n, 0)
  const verifiedCount = providers.filter((p) => p.isVerified).length
  const featured = providers.filter((p) => p.isFeatured).slice(0, 8)
  const featuredList = featured.length ? featured : providers.slice(0, 8)
  const recentVerified = providers.filter((p) => p.isVerified).slice(0, 4)

  const bundleTeaser =
    apiBundles.length > 0
      ? apiBundles.slice(0, 3).map((b) => ({
          name: b.name,
          range: formatBundleBand(b.priceFromKobo, b.priceToKobo),
          blurb: b.description,
          href: `/services/bundles?highlight=${encodeURIComponent(b.slug)}`,
        }))
      : BUNDLE_TEASER.map((b) => ({ ...b, href: "/services/bundles" }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b bg-primary/5">
        <div className="container mx-auto px-4 py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              The trusted network for real estate services
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Legal, survey, design, media, and construction — verified professionals matched to your
              property and location.
            </p>
            <div className="mt-10">
              <ServiceHubHeroSearch />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-10">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-center text-xl font-semibold md:text-2xl">
            Browse by category
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_HUB_CATEGORIES.map((c) => {
              const count = counts.get(c.slug)
              const disabled = !c.inPrismaEnum && count === undefined
              const inner = (
                <Card
                  className={cn(
                    "h-full transition hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/30",
                    disabled && "opacity-60",
                  )}
                >
                  <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <c.icon className="h-6 w-6 text-primary" aria-hidden />
                    </div>
                    <p className="font-medium leading-snug">{c.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {typeof count === "number"
                        ? `${count} providers`
                        : disabled
                          ? "Coming soon"
                          : "Explore"}
                    </p>
                  </CardContent>
                </Card>
              )
              return disabled ? (
                <div key={c.slug}>{inner}</div>
              ) : (
                <Link key={c.slug} href={`/services/${c.slug}`} className="block h-full">
                  {inner}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Featured providers</h2>
              <p className="text-muted-foreground">Verified teams we highlight across Nigeria</p>
            </div>
          </div>
          <ServiceHubFeaturedCarousel providers={featuredList} />
        </div>
      </section>

      <section className="border-y bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-2xl font-bold">Popular bundles</h2>
            <Button variant="outline" asChild>
              <Link href="/services/bundles">View all bundles</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {bundleTeaser.map((b) => (
              <Card key={b.name}>
                <CardContent className="space-y-3 p-6">
                  <h3 className="font-semibold leading-snug">{b.name}</h3>
                  <Badge variant="secondary">{b.range}</Badge>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{b.blurb}</p>
                  <Button className="w-full" variant="secondary" asChild>
                    <Link href={b.href}>Get started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">How ServiceHub works</h2>
          <ServiceHubHowItWorks />
        </div>
      </section>

      <section className="border-y bg-muted/15 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold">Recently verified</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recentVerified.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-2 p-4">
                  <p className="font-medium leading-snug">{p.businessName}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {p.category.replace(/_/g, " ")} · {p.city}
                  </p>
                  <Button asChild variant="link" className="h-auto px-0 text-primary">
                    <Link href={`/services/${p.category}/${p.slug}`}>View profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {[
              [
                directoryTotal > 0
                  ? `${directoryTotal.toLocaleString()}+`
                  : verifiedCount > 0
                    ? `${verifiedCount}+`
                    : "500+",
                "From ServiceHub directory",
              ],
              ["18,000+", "Jobs completed"],
              ["4.8", "Average rating"],
              [`${SERVICE_HUB_CATEGORIES.filter((c) => c.inPrismaEnum || counts.has(c.slug)).length}`, "Service categories"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold text-primary md:text-3xl">{n}</p>
                <p className="text-sm text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t py-8">
        <div className="container mx-auto px-4">
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
            Quick city entry
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(SERVICE_DIRECTORY_GEO) as (keyof typeof SERVICE_DIRECTORY_GEO)[]).map(
              (slug) => (
                <Button key={slug} variant="outline" size="sm" asChild>
                  <Link href={`/services/legal/${slug}`}>{SERVICE_DIRECTORY_GEO[slug]}</Link>
                </Button>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          <ServiceHubJoinCta />
        </div>
      </section>

      <Footer />
    </div>
  )
}
