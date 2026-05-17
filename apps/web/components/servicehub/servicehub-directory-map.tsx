"use client"

import dynamic from "next/dynamic"
import type { ApiServiceProviderListItem } from "@/lib/api/services-marketplace"

const Inner = dynamic(
  () =>
    import("./servicehub-directory-map-inner").then((m) => ({
      default: m.ServiceHubDirectoryMapInner,
    })),
  {
    ssr: false,
    loading: () => <div className="h-[420px] animate-pulse rounded-lg bg-muted" />,
  },
)

export function ServiceHubDirectoryMap({
  providers,
}: {
  providers: ApiServiceProviderListItem[]
}) {
  return <Inner providers={providers} />
}
