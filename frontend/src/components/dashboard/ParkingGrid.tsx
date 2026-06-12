import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { ParkingCircle } from 'lucide-react'
import type { ParkingSpot } from '@/types'

const statusColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
  free: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', label: 'Free' },
  reserved: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', label: 'Reserved' },
  occupied: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', label: 'Occupied' },
  maintenance: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-500', label: 'Maintenance' },
}

export function ParkingGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ['parking-spots-grid'],
    queryFn: () => api.get('/parking/spots').then((r) => r.data),
  })

  const { data: zonesData } = useQuery({
    queryKey: ['parking-zones-grid'],
    queryFn: () => api.get('/parking/zones').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 16 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded" />)}
          </div>
        </div>
      </div>
    )
  }

  const spots: ParkingSpot[] = data?.items ?? []
  const zones: any[] = zonesData?.items ?? []

  if (spots.length === 0) return null

  const grouped = zones.map((z: any) => ({
    zone: z,
    spots: spots.filter((s) => s.zone_id === z.id),
    free: spots.filter((s) => s.zone_id === z.id && s.status === 'free').length,
    occupied: spots.filter((s) => s.zone_id === z.id && s.status === 'occupied').length,
  }))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ParkingCircle className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Parking Spots</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span><span className="inline-block w-2 h-2 rounded-sm bg-green-400 mr-1" /> Free</span>
          <span><span className="inline-block w-2 h-2 rounded-sm bg-yellow-400 mr-1" /> Reserved</span>
          <span><span className="inline-block w-2 h-2 rounded-sm bg-red-400 mr-1" /> Occupied</span>
          <span><span className="inline-block w-2 h-2 rounded-sm bg-gray-300 mr-1" /> Maint</span>
        </div>
      </div>

      {grouped.map((g) => (
        <div key={g.zone.id} className="mb-4 last:mb-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{g.zone.name}</p>
            <p className="text-xs text-slate-400">{g.free} free / {g.occupied} occupied</p>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
            {g.spots.map((spot) => {
              const c = statusColors[spot.status] ?? statusColors.free
              return (
                <div
                  key={spot.id}
                  className={`${c.bg} ${c.border} border rounded-lg px-1 py-1.5 text-center text-xs font-medium ${c.text} transition-colors`}
                  title={`Spot ${spot.spot_number} - ${c.label}`}
                >
                  {spot.spot_number}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {grouped.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">No parking zones configured.</p>
      )}
    </div>
  )
}
