import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cargo } from '@/types'

function ShipmentMap({ cargo }: { cargo: Cargo }) {
  const map = useMap()

  useEffect(() => {
    if (cargo) {
      map.setView([43.65, 51.17], 6)
    }
  }, [cargo, map])

  const shipIcon = L.divIcon({
    className: 'bg-blue-500 rounded-full border-2 border-white shadow-lg',
    iconSize: [16, 16],
  })

  const waypoints = (cargo as any).route_waypoints as Array<{ lat: number; lng: number }> | null

  return (
    <>
      {waypoints && waypoints.length > 0 && (
        <Polyline
          positions={waypoints.map((w) => [w.lat, w.lng])}
          color="#3b82f6"
          weight={3}
          dashArray="10 6"
        />
      )}
      {waypoints?.map((wp, i) => (
        <Marker key={i} position={[wp.lat, wp.lng]} icon={shipIcon}>
          <Popup>
            Waypoint {i + 1}: {wp.lat}, {wp.lng}
          </Popup>
        </Marker>
      ))}
      <Marker position={[43.65, 51.17]} icon={L.divIcon({ className: 'bg-green-500 w-4 h-4 rounded-full', iconSize: [16, 16] })}>
        <Popup>Origin: {cargo.origin}</Popup>
      </Marker>
    </>
  )
}

export function ClientTrackingPage() {
  const { id } = useParams<{ id: string }>()

  const { data: cargo, isLoading } = useQuery({
    queryKey: ['cargo', id],
    queryFn: () => api.get(`/cargo/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  if (!id) {
    return (
      <div>
        <PageHeader title="Track Shipment" description="Enter a cargo ID in the URL to track it (e.g., /tracking/1)" />
      </div>
    )
  }

  if (isLoading) return <div className="p-6"><Skeleton className="h-96" /></div>
  if (!cargo) return <div className="p-6 text-slate-500">Cargo not found</div>

  const timeInfo = [
    { label: 'Status', value: cargo.status },
    { label: 'Origin', value: cargo.origin },
    { label: 'Destination', value: cargo.destination },
    { label: 'Vehicle Type', value: (cargo as any).vehicle_type || 'Not specified' },
    { label: 'Budget', value: (cargo as any).budget ? `$${(cargo as any).budget}` : 'Not set' },
    { label: 'ETA', value: cargo.eta ? new Date(cargo.eta).toLocaleString() : 'Not set' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={`Tracking Cargo #${cargo.id}`} description={`${cargo.origin} → ${cargo.destination}`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {timeInfo.map((info) => (
          <div key={info.label} className="bg-white rounded-xl border p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider">{info.label}</div>
            <div className="text-lg font-semibold mt-1">{info.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ height: 400 }}>
        <MapContainer center={[43.65, 51.17]} zoom={6} className="h-full w-full" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ShipmentMap cargo={cargo} />
        </MapContainer>
      </div>
    </div>
  )
}
