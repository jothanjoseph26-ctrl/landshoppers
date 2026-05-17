"use client"

import Link from "next/link"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { ApiServiceProviderListItem } from "@/lib/api/services-marketplace"

type Props = {
  providers: ApiServiceProviderListItem[]
}

function providersWithCoords(providers: ApiServiceProviderListItem[]) {
  return providers.filter(
    (p) =>
      typeof p.latitude === "number" &&
      typeof p.longitude === "number" &&
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude),
  ) as (ApiServiceProviderListItem & { latitude: number; longitude: number })[]
}

export function ServiceHubDirectoryMapInner({ providers }: Props) {
  const pinned = providersWithCoords(providers)

  if (pinned.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        Map view requires provider locations — switch to list view.
      </p>
    )
  }

  const centerLat = pinned.reduce((s, p) => s + p.latitude, 0) / pinned.length
  const centerLng = pinned.reduce((s, p) => s + p.longitude, 0) / pinned.length
  const zoom = pinned.length === 1 ? 13 : 11

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={zoom}
      className="h-[420px] w-full rounded-lg z-0"
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {pinned.map((p) => {
        const profileHref = `/services/${p.category}/${p.slug}?quote=1`
        return (
          <CircleMarker
            key={p.id}
            center={[p.latitude, p.longitude]}
            radius={9}
            pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{p.businessName}</p>
                <p className="text-muted-foreground">
                  {p.rating}★ · {p.reviewCount} reviews
                </p>
                <div className="flex flex-col gap-1">
                  <Link href={`/services/${p.category}/${p.slug}`} className="text-primary underline">
                    View profile
                  </Link>
                  <Link href={profileHref} className="text-primary underline">
                    Request quote
                  </Link>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
