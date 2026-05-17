import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ServiceHubCustomBundleBuilder } from "@/components/servicehub/servicehub-custom-bundle-builder"

export const metadata: Metadata = {
  title: "Build a custom bundle | LandShoppers ServiceHub",
  description: "Pick service categories and send coordinated quote requests to matched providers.",
}

type PageProps = {
  searchParams: Promise<{
    location?: string
    city?: string
    state?: string
    projectId?: string
  }>
}

export default async function CustomBundleBuildPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const defaultLocation =
    sp.location?.trim() ||
    (sp.city && sp.state ? `${sp.city}, ${sp.state}` : sp.city?.trim()) ||
    ""
  const defaultMessage = sp.projectId
    ? `Developer project RFQ (project ${sp.projectId}).`
    : ""

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">ServiceHub</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Custom bundle builder</h1>
        <p className="mt-3 text-muted-foreground">
          Select 2–6 categories, confirm your details, then review matched providers before sending
          quote requests.
        </p>
        <p className="mt-4 text-sm">
          Prefer a preset package?{" "}
          <Link href="/services/bundles" className="font-medium text-primary underline">
            Browse curated bundles
          </Link>
        </p>
        <div className="mt-10">
          <ServiceHubCustomBundleBuilder
            defaultLocation={defaultLocation}
            defaultMessage={defaultMessage}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
