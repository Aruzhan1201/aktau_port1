import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { useCargoList } from '@/hooks/useCargo'
import { useNavigate } from 'react-router-dom'
import { Clock, FileText, Truck, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/cards/StatCard'
import { ReportIncidentModal } from '@/components/incidents/ReportIncidentModal'

export function ReceiverDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [showReport, setShowReport] = useState(false)
  const { data: cargoData, isLoading } = useCargoList({ receiver_id: user?.id })

  const incomingCargoes = cargoData?.items?.filter((c) =>
    ['assigned', 'loading', 'in_transit', 'arrived'].includes(c.status)
  ) || []

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Receiver Dashboard"
        description="Monitor incoming cargo and deliveries"
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowReport(true)}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Report
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="ETA Monitoring" value={`${incomingCargoes.length} cargoes in transit`} icon={Clock} iconColor="bg-caspian-teal/20 text-caspian-teal" />
        <StatCard label="Documents" value="Access cargo documentation" icon={FileText} iconColor="bg-silk-gold/20 text-silk-gold-dark" />
        <StatCard label="Driver Schedules" value="View delivery schedules" icon={Truck} iconColor="bg-emerald-prosperity/20 text-emerald-prosperity" />
      </div>

      <div className="pattern-border-diamond rounded-xl bg-white dark:bg-modern-slate/20 border border-silk-gold/30 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-kazakh-burgundy dark:text-silk-gold mb-4 font-serif">Incoming Cargo</h2>
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : incomingCargoes.length === 0 ? (
          <p className="text-modern-slate dark:text-warm-sand text-sm font-sans">No incoming cargo</p>
        ) : (
          <div className="space-y-3">
            {incomingCargoes.map((c) => (
              <div key={c.id} onClick={() => navigate(`/cargo/${c.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-heritage-cream dark:bg-kazakh-burgundy-dark hover:bg-silk-gold/20 cursor-pointer transition-colors">
                <div>
                  <p className="font-medium text-kazakh-burgundy dark:text-silk-gold">{c.cargo_type}</p>
                  <p className="text-xs text-modern-slate dark:text-warm-sand">{c.origin} → {c.destination}</p>
                  {c.eta && <p className="text-xs text-caspian-teal mt-1">ETA: {new Date(c.eta).toLocaleDateString()}</p>}
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-prosperity/20 text-emerald-prosperity capitalize">{c.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReportIncidentModal open={showReport} onClose={() => setShowReport(false)} />
    </div>
  )
}
