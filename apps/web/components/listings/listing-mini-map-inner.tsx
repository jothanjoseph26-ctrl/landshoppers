'use client'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export function ListingMiniMapInner({
  latitude,
  longitude,
  title,
}: {
  latitude: number
  longitude: number
  title?: string
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      className="h-[220px] w-full rounded-lg z-0"
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker
        center={[latitude, longitude]}
        radius={9}
        pathOptions={{ color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.9 }}
      >
        <Popup>{title ?? 'Property location'}</Popup>
      </CircleMarker>
    </MapContainer>
  )
}
