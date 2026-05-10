'use client'

import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'

export type ListingMapFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    id?: string
    title?: string
    slug?: string
    price?: string
    propertyType?: string
  }
>

function formatMoneyKobo(price: string | undefined) {
  if (!price || !/^\d+$/.test(price)) return '—'
  const naira = Number(BigInt(price) / BigInt(100))
  return `₦${naira.toLocaleString()}`
}

function FitBounds({ features }: { features: ListingMapFeature[] }) {
  const map = useMap()
  useEffect(() => {
    if (features.length === 0) return
    const latlngs: L.LatLngExpression[] = features.map((f) => {
      const [lng, lat] = f.geometry.coordinates
      return [lat, lng]
    })
    const b = L.latLngBounds(latlngs)
    map.fitBounds(b, { padding: [48, 48], maxZoom: 14 })
  }, [features, map])
  return null
}

export function ListingMapPanel({
  features,
  selectedId,
  onSelectPin,
}: {
  features: ListingMapFeature[]
  selectedId?: string | null
  onSelectPin?: (id: string | null) => void
}) {
  const center = useMemo<[number, number]>(() => {
    if (features.length === 0) return [6.52, 3.37]
    const [lng0, lat0] = features[0].geometry.coordinates
    return [lat0, lng0]
  }, [features])

  return (
    <div className="relative h-[min(70vh,640px)] w-full min-h-[280px] overflow-hidden rounded-lg border bg-muted lg:sticky lg:top-20 lg:min-h-[calc(100vh-9rem)]">
      <MapContainer
        center={center}
        zoom={11}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds features={features} />
        {features.map((f, i) => {
          const [lng, lat] = f.geometry.coordinates
          const id = f.properties?.id ?? `m-${i}`
          const slug = f.properties?.slug ?? ''
          const active = Boolean(selectedId && id === selectedId)
          const priceShown = formatMoneyKobo(f.properties?.price)
          return (
            <CircleMarker
              key={id}
              center={[lat, lng]}
              radius={active ? 12 : 7}
              pathOptions={{
                color: '#0f766e',
                fillColor: active ? '#0d9488' : '#14b8a6',
                fillOpacity: 0.88,
              }}
              eventHandlers={{
                click: () => onSelectPin?.(id),
              }}
            >
              <Popup>
                <div className="min-w-[180px] text-sm space-y-1">
                  <p className="font-medium line-clamp-2">{f.properties?.title ?? 'Listing'}</p>
                  <p className="text-muted-foreground">{priceShown}</p>
                  {slug && (
                    <Link
                      className="text-primary underline"
                      href={`/listings/${slug}`}
                    >
                      View details
                    </Link>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      {features.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted/70 text-center text-sm text-muted-foreground">
          No mappable pins for the current filters
        </div>
      )}
    </div>
  )
}
