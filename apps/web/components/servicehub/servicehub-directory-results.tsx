import Link from "next/link"
import { ServiceHubProviderCard } from "@/components/servicehub/servicehub-provider-card"
import { ServiceHubDirectoryMap } from "@/components/servicehub/servicehub-directory-map"
import { Button } from "@/components/ui/button"
import type { ApiServiceProviderListItem } from "@/lib/api/services-marketplace"

type Props = {
  providers: ApiServiceProviderListItem[]
  view: "list" | "map"
  category: string
  emptyTitle?: string
  emptyDescription?: string
  emptyCtaHref?: string
  emptyCtaLabel?: string
}

export function ServiceHubDirectoryResults({
  providers,
  view,
  category,
  emptyTitle = "No providers in this slice yet",
  emptyDescription = "Try another category or city — or be the first to join this vertical.",
  emptyCtaHref = "/services/join",
  emptyCtaLabel = "Provider signup",
}: Props) {
  if (providers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <h2 className="text-lg font-semibold">{emptyTitle}</h2>
        <p className="mt-2 text-muted-foreground">{emptyDescription}</p>
        <Button asChild className="mt-6">
          <Link href={emptyCtaHref}>{emptyCtaLabel}</Link>
        </Button>
      </div>
    )
  }

  if (view === "map") {
    return <ServiceHubDirectoryMap providers={providers} />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {providers.map((p) => (
        <ServiceHubProviderCard key={p.id} provider={p} />
      ))}
    </div>
  )
}
