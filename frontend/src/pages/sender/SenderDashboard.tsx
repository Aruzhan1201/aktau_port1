import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { useCargoList } from '@/hooks/useCargo'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, CreditCard, AlertTriangle, Bot } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ReportIncidentModal } from '@/components/incidents/ReportIncidentModal'

export function SenderDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [showReport, setShowReport] = useState(false)
  const { data: cargoData, isLoading } = useCargoList({ client_id: user?.id })

  const activeCargoes = cargoData?.items?.filter((c) =>
    ['created', 'approved', 'assigned', 'loading', 'in_transit'].includes(c.status)
  ) || []

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Sender Dashboard"
        description="Manage your cargo shipments"
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowReport(true)}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Report
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate(ROUTES.CARGO_NEW)}
          className="p-6 pattern-border-diamond rounded-xl bg-white dark:bg-modern-slate/20 border border-silk-gold/30 shadow-sm hover:shadow-md transition-all text-left">
          <Plus className="w-8 h-8 text-silk-gold-dark mb-3" />
          <h3 className="font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Create Cargo</h3>
          <p className="text-sm text-modern-slate dark:text-warm-sand mt-1 font-sans">New shipment or AI-assisted order</p>
        </button>
        <button onClick={() => navigate(ROUTES.CARGO_AI_ORDER)}
          className="p-6 pattern-border-diamond rounded-xl bg-white dark:bg-modern-slate/20 border border-silk-gold/30 shadow-sm hover:shadow-md transition-all text-left">
          <Bot className="w-8 h-8 text-caspian-teal mb-3" />
          <h3 className="font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">AI Order</h3>
          <p className="text-sm text-modern-slate dark:text-warm-sand mt-1 font-sans">Natural language cargo ordering</p>
        </button>
        <button onClick={() => navigate(ROUTES.PAYMENTS)}
          className="p-6 pattern-border-diamond rounded-xl bg-white dark:bg-modern-slate/20 border border-silk-gold/30 shadow-sm hover:shadow-md transition-all text-left">
          <CreditCard className="w-8 h-8 text-emerald-prosperity mb-3" />
          <h3 className="font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Payments</h3>
          <p className="text-sm text-modern-slate dark:text-warm-sand mt-1 font-sans">View and manage payments</p>
        </button>
      </div>

      <div className="pattern-border-diamond rounded-xl bg-white dark:bg-modern-slate/20 border border-silk-gold/30 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-kazakh-burgundy dark:text-silk-gold mb-4 font-serif">Active Shipments</h2>
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : activeCargoes.length === 0 ? (
          <p className="text-modern-slate dark:text-warm-sand text-sm font-sans">No active shipments</p>
        ) : (
          <div className="space-y-3">
            {activeCargoes.map((c) => (
              <div key={c.id} onClick={() => navigate(`/cargo/${c.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-heritage-cream dark:bg-kazakh-burgundy-dark hover:bg-silk-gold/20 cursor-pointer transition-colors">
                <div>
                  <p className="font-medium text-kazakh-burgundy dark:text-silk-gold">{c.cargo_type}</p>
                  <p className="text-xs text-modern-slate dark:text-warm-sand">{c.origin} → {c.destination}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-caspian-teal/20 text-caspian-teal capitalize">{c.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReportIncidentModal open={showReport} onClose={() => setShowReport(false)} />
    </div>
  )
}
