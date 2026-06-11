import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useCargoList } from '@/hooks/useCargo'
import { useShipList } from '@/hooks/useShip'
import { api } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Package, Map, ArrowRight, ParkingCircle, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { ParkingSpot } from '@/types'

export function DriverDashboard() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const { data: cargoes } = useCargoList({ driver_id: user?.id })
  const { data: ships } = useShipList()
  const [parkingSuccess, setParkingSuccess] = useState(false)
  const [parkingError, setParkingError] = useState('')

  const { data: spotsData } = useQuery({
    queryKey: ['parking-spots-driver'],
    queryFn: () => api.get('/parking/spots').then((r) => r.data),
  })

  const freeSpots: ParkingSpot[] = spotsData?.items?.filter((s: ParkingSpot) => s.status === 'free') ?? []
  const mySpot: ParkingSpot | undefined = spotsData?.items?.find((s: ParkingSpot) => s.driver_id === user?.id)

  const requestSpot = useMutation({
    mutationFn: (spotId: number) => api.post(`/parking/spots/${spotId}/assign`, {
      driver_id: user?.id,
    }),
    onSuccess: () => { setParkingSuccess(true); setParkingError('') },
    onError: (err: any) => setParkingError(err?.response?.data?.detail || err?.message || 'Failed to book parking'),
  })

  const myCargoes = cargoes?.items ?? []
  const activeCargoes = myCargoes.filter((c) =>
    ['assigned', 'loading', 'in_transit'].includes(c.status)
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Driver'}`}
        description="Your cargo and route overview"
      />

      {activeCargoes.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Active Shipments</h3>
            </div>
            <Link to="/map">
              <Button variant="ghost" size="sm">
                View on Map <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {activeCargoes.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 truncate">
                    #{c.id} {c.cargo_type}
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.origin} → {c.destination}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === 'in_transit' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                  <Link to={`/map?cargo=${c.id}`}>
                    <Button size="sm" variant="outline">
                      <Map className="w-3.5 h-3.5" />
                      Route
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myCargoes.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No shipments assigned</h3>
          <p className="text-xs text-slate-400 mb-4">You don't have any cargo assigned yet. Check the map to view port activity.</p>
          <Link to="/map">
            <Button size="sm">
              <Map className="w-4 h-4" />
              Open Port Map
            </Button>
          </Link>
        </div>
      )}

      {myCargoes.length > 0 && activeCargoes.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-400 text-center py-4">No active shipments in transit.</p>
        </div>
      )}

      {/* Parking Section */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ParkingCircle className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Parking</h3>
        </div>
        {mySpot ? (
          <p className="text-sm text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            You are assigned to spot {mySpot.spot_number}
          </p>
        ) : parkingSuccess ? (
          <div>
            <p className="text-sm text-emerald-600 font-medium mb-2">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              Spot assigned! You can now park.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setParkingSuccess(false); queryClient.invalidateQueries({ queryKey: ['parking-spots-driver'] }) }}>
              Refresh
            </Button>
          </div>
        ) : (
          <div>
            {parkingError && (
              <p className="text-sm text-red-600 mb-2 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                {parkingError}
              </p>
            )}
            <p className="text-sm text-slate-500 mb-3">{freeSpots.length} free spots available</p>
            <div className="flex flex-wrap gap-2">
              {freeSpots.slice(0, 10).map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => requestSpot.mutate(spot.id)}
                  disabled={requestSpot.isPending}
                  className="px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  Spot {spot.spot_number}
                </button>
              ))}
              {freeSpots.length > 10 && (
                <Link to="/parking/spots">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              )}
            </div>
            {freeSpots.length === 0 && (
              <p className="text-xs text-slate-400">No free spots available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
