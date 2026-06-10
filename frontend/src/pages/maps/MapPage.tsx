import { useMapShips, useMapBerths } from '@/hooks/useOther'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function MapPage() {
  const { data: ships, isLoading: shipsLoading } = useMapShips()
  const { data: berths, isLoading: berthsLoading } = useMapBerths()
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    mapRef.current = L.map(mapContainerRef.current, {
      center: [43.65, 52.0],
      zoom: 8,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current)
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const markers: L.Marker[] = []

    if (ships) {
      ships.forEach((s) => {
        if (s.latitude && s.longitude) {
          const statusColors: Record<string, string> = {
            available: '#3b82f6',
            berthed: '#10b981',
            in_transit: '#8b5cf6',
            maintenance: '#f59e0b',
          }
          const color = statusColors[s.status] || '#3b82f6'
          const marker = L.marker([s.latitude, s.longitude], {
            icon: L.divIcon({
              className: '',
              html: `<div style="background:${color};color:white;padding:3px 8px;border-radius:6px;white-space:nowrap;font-size:11px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,0.15)">🚢 ${s.name}</div>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
          }).addTo(map)
          marker.bindPopup(`
            <div style="font-family:system-ui;min-width:160px">
              <p style="font-weight:600;margin:0 0 4px">${s.name}</p>
              <p style="font-size:12px;color:#64748b;margin:0">Status: ${s.status.replace('_', ' ')}</p>
              <p style="font-size:12px;color:#64748b;margin:0">Capacity: ${s.capacity}t</p>
            </div>
          `)
          markers.push(marker)
        }
      })
    }

    if (berths) {
      berths.forEach((b) => {
        if (b.latitude && b.longitude) {
          const color = b.status === 'free' ? '#22c55e' : b.status === 'occupied' ? '#ef4444' : '#f59e0b'
          const circle = L.circleMarker([b.latitude, b.longitude], {
            radius: 12,
            fillColor: color,
            color: '#fff',
            weight: 3,
            fillOpacity: 0.85,
          }).addTo(map)
          circle.bindPopup(`
            <div style="font-family:system-ui;min-width:160px">
              <p style="font-weight:600;margin:0 0 4px">${b.name}</p>
              <p style="font-size:12px;color:#64748b;margin:0">Status: ${b.status}</p>
              <p style="font-size:12px;color:#64748b;margin:0">Capacity: ${b.capacity}t</p>
              ${b.current_ship_name ? `<p style="font-size:12px;color:#64748b;margin:0">Ship: ${b.current_ship_name}</p>` : ''}
            </div>
          `)
          markers.push(circle as unknown as L.Marker)
        }
      })
    }

    return () => {
      markers.forEach((m) => m.remove())
    }
  }, [ships, berths])

  const loading = shipsLoading || berthsLoading

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Port Map"
        description="Real-time ship and berth positions"
      />
      {loading ? (
        <Skeleton className="w-full h-[600px] rounded-xl" />
      ) : (
        <div ref={mapContainerRef} className="w-full h-[600px] rounded-xl border border-slate-200 shadow-sm" />
      )}
    </div>
  )
}
