import Link from "next/link"
import type { Metadata } from "next"
import { Layers, Wrench } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceHubBundlesCatalog } from "@/components/servicehub/servicehub-bundles-catalog"
import { fetchServiceBundlesPublic } from "@/lib/api/services-marketplace"

export const metadata: Metadata = {
  title: "Service bundles | LandShoppers ServiceHub",
  description:
    "Complete real estate service packages — legal, survey, media, and construction coordinated in one request.",
}

type PageProps = {
  searchParams: Promise<{
    highlight?: string
    location?: string
    projectId?: string
    city?: string
    state?: string
  }>
}

export default async function ServiceBundlesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const bundles = await fetchServiceBundlesPublic()

  const defaultLocation =
    sp.location?.trim() ||
    (sp.city && sp.state ? `${sp.city}, ${sp.state}` : sp.city?.trim()) ||
    ""

  const defaultMessage = sp.projectId
    ? `Developer project RFQ (project ${sp.projectId}).`
    : undefined

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <section className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">ServiceHub</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Complete real estate service packages — everything you need, in one place
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Bundles coordinate multiple verified providers with a single activation. You confirm
            location and details; we create structured quote requests for each service category.
          </p>
        </section>

        <Card className="mt-8 border-dashed bg-muted/20">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-base">Build your own bundle</CardTitle>
              <CardDescription>
                Pick 2–6 categories and send one coordinated multi-quote request.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/services/bundles/build">Custom bundle builder</Link>
            </Button>
          </CardContent>
        </Card>

        {bundles.length === 0 ? (
          <Card className="mt-10 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">No bundles published yet</CardTitle>
              <CardDescription>
                Seed ServiceHub bundles in the API or use the custom builder to request services by
                category.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/services/bundles/build">Custom bundle</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/services">Directory</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10">
            <ServiceHubBundlesCatalog
              bundles={bundles}
              highlightSlug={sp.highlight ?? null}
              defaultLocation={defaultLocation}
              defaultMessage={defaultMessage}
              defaultDeveloperProjectId={sp.projectId}
            />
          </div>
        )}

        <div className="mt-12 flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" aria-hidden />
          <span>
            Developers: attach bundles to a project from{" "}
            <Link href="/developer/projects" className="font-medium text-primary underline">
              your portal
            </Link>
            .
          </span>
        </div>
      </main>
      <Footer />
    </div>
  )
}
