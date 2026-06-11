import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import type { TrafficOverview } from '@/types'

export function GovTrafficPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['traffic-analytics'],
    queryFn: () => api.get('/governance/traffic').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Traffic Analytics" description="Overall port and parking traffic overview" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-5"><Skeleton className="h-24" /></div>
          ))}
        </div>
      </div>
    )
  }

  const traffic: TrafficOverview = data

  return (
    <div className="space-y-6">
      <PageHeader title="Traffic Analytics" description="Overall port and parking traffic overview" />

      {/* Cargo Section */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-lg font-semibold mb-3">Cargo Traffic</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-500">Total</div>
            <div className="text-2xl font-bold">{traffic?.cargo?.total ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">In Transit</div>
            <div className="text-2xl font-bold text-blue-600">{traffic?.cargo?.in_transit ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Waiting</div>
            <div className="text-2xl font-bold text-yellow-600">{traffic?.cargo?.waiting_for_assignment ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Berths Section */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-lg font-semibold mb-3">Berth Occupancy</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-500">Total</div>
            <div className="text-2xl font-bold">{traffic?.berths?.total ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Free</div>
            <div className="text-2xl font-bold text-green-600">{traffic?.berths?.free ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Utilization</div>
            <div className="text-2xl font-bold">{traffic?.berths?.utilization_pct ?? 0}%</div>
          </div>
        </div>
      </div>

      {/* Parking Section */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-lg font-semibold mb-3">Parking Utilization</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-500">Total Spots</div>
            <div className="text-2xl font-bold">{traffic?.parking?.total_spots ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Free</div>
            <div className="text-2xl font-bold text-green-600">{traffic?.parking?.free_spots ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Utilization</div>
            <div className="text-2xl font-bold">{traffic?.parking?.utilization_pct ?? 0}%</div>
          </div>
        </div>
      </div>

      {/* Queue Section */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-lg font-semibold mb-3">Queue Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-500">Waiting</div>
            <div className="text-2xl font-bold text-yellow-600">{traffic?.queue?.waiting ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Avg Wait Time</div>
            <div className="text-2xl font-bold">{traffic?.queue?.avg_wait_hours ?? 0} hrs</div>
          </div>
        </div>
      </div>
    </div>
  )
}
