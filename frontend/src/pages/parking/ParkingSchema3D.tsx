import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import type { ParkingZone, ParkingSpot } from '@/types'

const statusColors: Record<string, string> = {
  free: '#22c55e',
  reserved: '#eab308',
  occupied: '#ef4444',
  maintenance: '#6b7280',
}

export function ParkingSchema3D() {
  const user = useAuthStore((s) => s.user)

  const { data: zonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ['parking-zones'],
    queryFn: () => api.get('/parking/zones').then((r) => r.data),
  })

  const { data: spotsData, isLoading: spotsLoading } = useQuery({
    queryKey: ['parking-spots'],
    queryFn: () => api.get('/parking/spots').then((r) => r.data),
  })

  if (zonesLoading || spotsLoading) return <Skeleton className="h-96" />

  const zones: ParkingZone[] = zonesData?.items ?? []
  const spots: ParkingSpot[] = spotsData?.items ?? []

  const occupied = spots.filter((s) => s.status === 'occupied').length
  const free = spots.filter((s) => s.status === 'free').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parking Schema"
        description="Real-time car/truck parking visualization"
      />

      {/* Stats bar */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: statusColors.free }} />
          <span>Free: {free}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: statusColors.occupied }} />
          <span>Occupied: {occupied}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: statusColors.reserved }} />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: statusColors.maintenance }} />
          <span>Maintenance</span>
        </div>
      </div>

      {/* SVG Parking Layout */}
      {zones.map((zone) => {
        const zoneSpots = spots.filter((s) => s.zone_id === zone.id)
        const cols = Math.min(zoneSpots.length, 10)
        const rows = Math.ceil(zoneSpots.length / cols)
        const cellW = 60
        const cellH = 40
        const gap = 8
        const padding = 20
        const svgW = cols * (cellW + gap) + padding * 2
        const svgH = rows * (cellH + gap) + padding * 2 + 40

        return (
          <div key={zone.id} className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-slate-700 mb-3">
              {zone.name} ({zone.port}) — {zone.status}
            </h3>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-3xl" xmlns="http://www.w3.org/2000/svg">
              {/* Title */}
              <text x={svgW / 2} y={16} textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">
                {zone.name} — Capacity: {zone.capacity}
              </text>
              {/* Driving lanes */}
              {Array.from({ length: rows + 1 }).map((_, ri) => (
                <rect
                  key={`lane-${ri}`}
                  x={padding}
                  y={padding + 40 + ri * (cellH + gap) - gap / 2}
                  width={cols * (cellW + gap)}
                  height={gap}
                  fill="#e5e7eb"
                  rx={2}
                />
              ))}
              {/* Spots */}
              {zoneSpots.map((spot, idx) => {
                const col = idx % cols
                const row = Math.floor(idx / cols)
                const x = padding + col * (cellW + gap)
                const y = padding + 40 + row * (cellH + gap)
                const color = statusColors[spot.status] || statusColors.free
                const isOccupied = spot.status === 'occupied'
                return (
                  <g key={spot.id}>
                    <rect
                      x={x}
                      y={y}
                      width={cellW}
                      height={cellH}
                      fill={color}
                      opacity={isOccupied ? 0.8 : 0.4}
                      stroke={color}
                      strokeWidth={1.5}
                      rx={4}
                    />
                    <text
                      x={x + cellW / 2}
                      y={y + cellH / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isOccupied ? 'white' : '#374151'}
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {spot.spot_number.split('-').pop()}
                    </text>
                    {isOccupied && (
                      <text
                        x={x + cellW / 2}
                        y={y + cellH / 2 + 12}
                        textAnchor="middle"
                        fill="white"
                        fontSize="8"
                      >
                        🚛
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        )
      })}

      {zones.length === 0 && (
        <div className="text-center text-slate-400 py-12">
          No parking zones created yet. Create one from the Parking Zones page.
        </div>
      )}
    </div>
  )
}
