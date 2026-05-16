import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceHubBundleActivateForm } from "@/components/servicehub/servicehub-bundle-activate"
import { fetchServiceBundlesPublic, type ApiServiceBundle } from "@/lib/api/services-marketplace"
import { getServiceHubCategoryMeta } from "@/lib/servicehub/categories"

export const metadata: Metadata = {
  title: "Service bundles | LandShoppers ServiceHub",
  description:
    "Multi-service packages for title work, new home readiness, listing launches, and developer projects.",
}

function formatBand(fromKobo: string, toKobo: string): string {
  const lo = Number(BigInt(fromKobo)) / 100
  const hi = Number(BigInt(toKobo)) / 100
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return "Price on request"
  const fmt = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  })
  return `${fmt.format(lo)} – ${fmt.format(hi)} (est.)`
}

function BundleCard({ b }: { b: ApiServiceBundle }) {
  const price = formatBand(b.priceFromKobo, b.priceToKobo)
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{b.name}</CardTitle>
        <CardDescription>{b.description}</CardDescription>
        <p className="pt-2 text-sm font-medium text-primary">{price}</p>
        <p className="text-xs text-muted-foreground">
          {b.categories.length} categories · {b.activationCount} activations to date
        </p>
      </CardHeader>
      <CardContent className="mt-auto space-y-3 border-t pt-4">
        <div className="flex flex-wrap gap-1">
          {b.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {getServiceHubCategoryMeta(c)?.label ?? c}
            </span>
          ))}
        </div>
        <ServiceHubBundleActivateForm bundleId={b.id} bundleName={b.name} />
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href="/services">Browse directory</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default async function ServiceBundlesPage() {
  const bundles = await fetchServiceBundlesPublic()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Service packages</h1>
          <p className="mt-3 text-muted-foreground">
            One request can notify the best-matched provider in each category. You sign in, we route
            structured leads to their ServiceHub inbox.
          </p>
        </div>

        {bundles.length === 0 ? (
          <Card className="mt-10 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">No bundles published yet</CardTitle>
              <CardDescription>
                Seed the database or check that the API is running at{" "}
                <code className="text-xs">NEXT_PUBLIC_API_URL</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/services">Back to ServiceHub</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {bundles.map((b) => (
              <BundleCard key={b.id} b={b} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
