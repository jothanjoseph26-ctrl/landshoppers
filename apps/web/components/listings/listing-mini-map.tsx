'use client'

import dynamic from 'next/dynamic'

const Inner = dynamic(
  () =>
    import('./listing-mini-map-inner').then((m) => ({ default: m.ListingMiniMapInner })),
  { ssr: false, loading: () => <div className="h-[220px] animate-pulse rounded-lg bg-muted" /> },
)

export function ListingMiniMap({
  latitude,
  longitude,
  title,
}: {
  latitude: number
  longitude: number
  title?: string
}) {
  return <Inner latitude={latitude} longitude={longitude} title={title} />
}
