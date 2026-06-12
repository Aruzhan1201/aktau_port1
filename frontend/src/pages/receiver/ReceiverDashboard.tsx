import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { useCargoList } from '@/hooks/useCargo'
import { useNavigate } from 'react-router-dom'
import { Clock, FileText, Truck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function ReceiverDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { data: cargoData, isLoading } = useCargoList({ receiver_id: user?.id })

  const incomingCargoes = cargoData?.items?.filter((c) =>
    ['assigned', 'loading', 'in_transit', 'arrived'].includes(c.status)
  ) || []

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Receiver Dashboard" description="Monitor incoming cargo and deliveries" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          <Clock className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold text-slate-800">ETA Monitoring</h3>
          <p className="text-sm text-slate-500 mt-1">{incomingCargoes.length} cargoes in transit</p>
        </div>
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          <FileText className="w-8 h-8 text-amber-500 mb-3" />
          <h3 className="font-semibold text-slate-800">Documents</h3>
          <p className="text-sm text-slate-500 mt-1">Access cargo documentation</p>
        </div>
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          <Truck className="w-8 h-8 text-green-500 mb-3" />
          <h3 className="font-semibold text-slate-800">Driver Schedules</h3>
          <p className="text-sm text-slate-500 mt-1">View delivery schedules</p>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Incoming Cargo</h2>
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : incomingCargoes.length === 0 ? (
          <p className="text-slate-500 text-sm">No incoming cargo</p>
        ) : (
          <div className="space-y-3">
            {incomingCargoes.map((c) => (
              <div key={c.id} onClick={() => navigate(`/cargo/${c.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <div>
                  <p className="font-medium text-slate-800">{c.cargo_type}</p>
                  <p className="text-xs text-slate-500">{c.origin} → {c.destination}</p>
                  {c.eta && <p className="text-xs text-blue-600 mt-1">ETA: {new Date(c.eta).toLocaleDateString()}</p>}
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 capitalize">{c.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
