import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePortMapBerths, usePortMapRoutes, useWeather } from '@/hooks/useOther'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useWsStore } from '@/store/wsStore'
import { api } from '@/api/client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const STATUS_COLORS: Record<string, string> = {
  free: '#22c55e', reserved: '#3b82f6', occupied: '#ef4444', maintenance: '#f59e0b',
}

const PORTS = ['aktau', 'kuryk'] as const
const PORT_CENTERS: Record<string, [number, number]> = {
  aktau: [43.65, 51.17],
  kuryk: [43.22, 51.65],
}

const DEFAULT_CENTER: [number, number] = [43.43, 51.41]
const DEFAULT_ZOOM = 9

export function MapPage() {
  const user = useAuthStore((s) => s.user)
  const [searchParams] = useSearchParams()
  const cargoParam = searchParams.get('cargo')

  const [trackingId, setTrackingId] = useState(cargoParam || '')
  const [trackedCargo, setTrackedCargo] = useState<any>(null)
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackError, setTrackError] = useState('')
  const subscribeChannel = useWsStore((s) => s.subscribeChannel)

  const aktauBerths = usePortMapBerths('aktau')
  const kurykBerths = usePortMapBerths('kuryk')
  const aktauRoutes = usePortMapRoutes('aktau')
  const kurykRoutes = usePortMapRoutes('kuryk')
  const aktauWeather = useWeather('aktau')
  const kurykWeather = useWeather('kuryk')

  useEffect(() => {
    PORTS.forEach((p) => subscribeChannel('berths', p))
    return () => { PORTS.forEach((p) => useWsStore.getState().unsubscribeChannel('berths')) }
  }, [subscribeChannel])

  useEffect(() => {
    if (cargoParam) {
      const id = parseInt(cargoParam, 10)
      if (!isNaN(id)) {
        setTrackLoading(true)
        api.get(`/cargo/${id}`).then((res) => {
          setTrackedCargo(res.data)
          setTrackError('')
        }).catch(() => {
          setTrackError('Cargo not found')
        }).finally(() => setTrackLoading(false))
      }
    }
  }, [cargoParam])

  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    mapRef.current = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current)
    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const overlays: L.Layer[] = []

    const allBerths = [...(aktauBerths.data || []), ...(kurykBerths.data || [])]
    allBerths.forEach((b: any) => {
      const color = STATUS_COLORS[b.status] || '#94a3b8'
      const circle = L.circleMarker([b.latitude, b.longitude], {
        radius: 14, fillColor: color, color: '#fff', weight: 3, fillOpacity: 0.85,
      }).addTo(map)
      circle.bindPopup(`
        <div style="font-family:system-ui;min-width:160px">
          <p style="font-weight:600;margin:0 0 4px">${b.name}</p>
          <p style="font-size:12px;color:#64748b;margin:0">Status: <span style="color:${color};font-weight:600">${b.status}</span></p>
          <p style="font-size:12px;color:#64748b;margin:0">Capacity: ${b.capacity}t</p>
        </div>
      `)
      overlays.push(circle)
    })

    const allRoutes = [...(aktauRoutes.data || []), ...(kurykRoutes.data || [])]
    allRoutes.forEach((r: any) => {
      if (r.waypoints && r.waypoints.length > 1) {
        const coords = r.waypoints.map((w: any) => [w.lat, w.lng])
        const polyline = L.polyline(coords, {
          color: r.color_hex, weight: 3, dashArray: '10, 10', opacity: 0.8,
        }).addTo(map)
        polyline.bindPopup(`
          <div style="font-family:system-ui">
            <p style="font-weight:600;margin:0 0 4px">${r.name}</p>
            <p style="font-size:12px;color:#64748b;margin:0">${r.description || ''}</p>
            ${r.distance_km ? `<p style="font-size:12px;color:#64748b;margin:0">Distance: ${r.distance_km} km</p>` : ''}
          </div>
        `)
        overlays.push(polyline)
      }
    })

    // Port labels
    PORTS.forEach((p) => {
      const [lat, lng] = PORT_CENTERS[p]
      const label = L.marker([lat + 0.05, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="background:#1e293b;color:white;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${p.charAt(0).toUpperCase() + p.slice(1)} Port</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      }).addTo(map)
      overlays.push(label)
    })

    // Tracking overlay
    let trackingOverlays: L.Layer[] = []
    if (trackedCargo) {
      const waypoints = trackedCargo.route_waypoints as Array<{ lat: number; lng: number }> | null
      if (waypoints && waypoints.length > 0) {
        const coords = waypoints.map((w: any) => [w.lat, w.lng])
        const polyline = L.polyline(coords, {
          color: '#8b5cf6', weight: 4, dashArray: '8, 8', opacity: 0.9,
        }).addTo(map)
        trackingOverlays.push(polyline)

        waypoints.forEach((wp, i) => {
          const color = i === 0 ? '#22c55e' : i === waypoints.length - 1 ? '#ef4444' : '#3b82f6'
          const marker = L.circleMarker([wp.lat, wp.lng], {
            radius: 8, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9,
          }).addTo(map)
          marker.bindPopup(`
            <div style="font-family:system-ui">
              <p style="font-weight:600;margin:0 0 4px">${i === 0 ? 'Origin' : i === waypoints.length - 1 ? 'Destination' : `Waypoint ${i + 1}`}</p>
              <p style="font-size:12px;color:#64748b;margin:0">${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}</p>
            </div>
          `)
          trackingOverlays.push(marker)
        })
      }

      // Cargo info popup at center
      if (waypoints && waypoints.length > 0) {
        const mid = waypoints[Math.floor(waypoints.length / 2)]
        const infoMarker = L.marker([mid.lat, mid.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="background:white;border:2px solid #8b5cf6;padding:6px 12px;border-radius:8px;font-size:12px;font-family:system-ui;box-shadow:0 4px 12px rgba(0,0,0,0.15);white-space:nowrap"><strong>#${trackedCargo.id}</strong> ${trackedCargo.cargo_type}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
        }).addTo(map)
        trackingOverlays.push(infoMarker)

        const allCoords = waypoints.map((w: any) => [w.lat, w.lng] as [number, number])
        map.fitBounds(allCoords, { padding: [50, 50], maxZoom: 12 })
      }
    }

    // Legend
    const legend = new L.Control({ position: 'bottomleft' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', '')
      div.innerHTML = `
        <div style="background:white;padding:8px 12px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:11px;font-family:system-ui;max-height:300px;overflow-y:auto">
          <p style="font-weight:600;margin:0 0 4px;color:#1e293b">Berth Status</p>
          <div style="display:flex;flex-direction:column;gap:2px">
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e;margin-right:6px"></span>Free</span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#3b82f6;margin-right:6px"></span>Reserved</span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444;margin-right:6px"></span>Occupied</span>
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f59e0b;margin-right:6px"></span>Maintenance</span>
          </div>
          ${allRoutes.length > 0 ? `<hr style="margin:6px 0;border:0;border-top:1px solid #e2e8f0" />
          <p style="font-weight:600;margin:0 0 4px;color:#1e293b">Routes</p>
          ${allRoutes.map((r: any) => `<span style="display:block"><span style="display:inline-block;width:16px;height:3px;background:${r.color_hex};margin-right:6px;vertical-align:middle"></span>${r.name}</span>`).join('')}` : ''}
          ${trackedCargo ? `<hr style="margin:6px 0;border:0;border-top:1px solid #e2e8f0" />
          <p style="font-weight:600;margin:0 0 4px;color:#7c3aed">Tracking #${trackedCargo.id}</p>
          <p style="font-size:10px;color:#64748b;margin:0">${trackedCargo.origin} → ${trackedCargo.destination}</p>` : ''}
        </div>
      `
      return div
    }
    legend.addTo(map)

    return () => {
      overlays.forEach((o) => o.remove())
      trackingOverlays.forEach((o) => o.remove())
      legend.remove()
    }
  }, [aktauBerths.data, kurykBerths.data, aktauRoutes.data, kurykRoutes.data, trackedCargo])

  const handleTrack = async () => {
    const id = parseInt(trackingId, 10)
    if (!id || isNaN(id)) { setTrackError('Enter a valid cargo ID'); return }
    setTrackLoading(true)
    setTrackError('')
    try {
      const res = await api.get(`/cargo/${id}`)
      setTrackedCargo(res.data)
    } catch {
      setTrackError('Cargo not found')
      setTrackedCargo(null)
    } finally {
      setTrackLoading(false)
    }
  }

  const handleClearTracking = () => {
    setTrackingId('')
    setTrackedCargo(null)
    setTrackError('')
    mapRef.current?.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
  }

  const loading = aktauBerths.isLoading || kurykBerths.isLoading
  const weatherAktau = aktauWeather.data
  const weatherKuryk = kurykWeather.data

  return (
    <div className="animate-fade-in">
      <PageHeader title="Port Map" description="Aktau & Kuryk ports — berths, routes, and cargo tracking">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {weatherAktau && (
            <span className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Aktau:</span>
              <span>Wind: {weatherAktau.wind_speed?.toFixed(1)} m/s</span>
              <span>Wave: {weatherAktau.wave_height?.toFixed(1)} m</span>
              {weatherAktau.storm_alert && <span className="text-red-600 font-medium">⚠</span>}
            </span>
          )}
          {weatherKuryk && (
            <span className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Kuryk:</span>
              <span>Wind: {weatherKuryk.wind_speed?.toFixed(1)} m/s</span>
              <span>Wave: {weatherKuryk.wave_height?.toFixed(1)} m</span>
              {weatherKuryk.storm_alert && <span className="text-red-600 font-medium">⚠</span>}
            </span>
          )}
        </div>
      </PageHeader>

      <div className="flex items-center gap-3 mb-4 bg-white rounded-xl border p-3 shadow-sm">
        <Input
          placeholder="Enter cargo ID to track..."
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
          className="max-w-xs"
        />
        <Button size="sm" onClick={handleTrack} loading={trackLoading}>Track</Button>
        {trackedCargo && (
          <Button size="sm" variant="outline" onClick={handleClearTracking}>Clear</Button>
        )}
        {trackError && <span className="text-xs text-red-500">{trackError}</span>}
        {trackedCargo && (
          <span className="text-xs text-slate-500 ml-auto">
            Tracking <strong>#{trackedCargo.id}</strong> — {trackedCargo.origin} → {trackedCargo.destination}
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="w-full h-[600px] rounded-xl" />
      ) : (
        <div ref={mapContainerRef} className="w-full h-[600px] rounded-xl border border-slate-200 shadow-sm" />
      )}
    </div>
  )
}
