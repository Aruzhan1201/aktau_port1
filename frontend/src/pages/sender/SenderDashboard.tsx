import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { useCargoList } from '@/hooks/useCargo'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, CreditCard } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { Skeleton } from '@/components/ui/skeleton'

export function SenderDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { data: cargoData, isLoading } = useCargoList({ client_id: user?.id })

  const activeCargoes = cargoData?.items?.filter((c) =>
    ['created', 'approved', 'assigned', 'loading', 'in_transit'].includes(c.status)
  ) || []

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Sender Dashboard" description="Manage your cargo shipments" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate(ROUTES.CARGO_NEW)}
          className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-left">
          <Plus className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold text-slate-800">Create Cargo</h3>
          <p className="text-sm text-slate-500 mt-1">New shipment or AI-assisted order</p>
        </button>
        <button onClick={() => navigate(ROUTES.CARGO_AI_ORDER)}
          className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-left">
          <Package className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="font-semibold text-slate-800">AI Order</h3>
          <p className="text-sm text-slate-500 mt-1">Natural language cargo ordering</p>
        </button>
        <button onClick={() => navigate(ROUTES.PAYMENTS)}
          className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-left">
          <CreditCard className="w-8 h-8 text-green-500 mb-3" />
          <h3 className="font-semibold text-slate-800">Payments</h3>
          <p className="text-sm text-slate-500 mt-1">View and manage payments</p>
        </button>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Active Shipments</h2>
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : activeCargoes.length === 0 ? (
          <p className="text-slate-500 text-sm">No active shipments</p>
        ) : (
          <div className="space-y-3">
            {activeCargoes.map((c) => (
              <div key={c.id} onClick={() => navigate(`/cargo/${c.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <div>
                  <p className="font-medium text-slate-800">{c.cargo_type}</p>
                  <p className="text-xs text-slate-500">{c.origin} → {c.destination}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">{c.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
