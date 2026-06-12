import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCargoList } from '@/hooks/useCargo'
import { PageHeader } from '@/components/common/PageHeader'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/cards/StatCard'
import { Package, Map, ArrowRight, Ship, AlertTriangle } from 'lucide-react'
import { TransitRoutesTable } from '@/components/dashboard/TransitRoutesTable'
import { ParkingGrid } from '@/components/dashboard/ParkingGrid'
import { BerthGrid } from '@/components/dashboard/BerthGrid'
import { RouteChatbot } from '@/components/dashboard/RouteChatbot'
import { ReportIncidentModal } from '@/components/incidents/ReportIncidentModal'

export function DriverDashboard() {
  const user = useAuthStore((s) => s.user)
  const { data: cargoes } = useCargoList({ driver_id: user?.id })
  const [showReport, setShowReport] = useState(false)

  const myCargoes = cargoes?.items ?? []
  const activeCargoes = myCargoes.filter((c) =>
    ['assigned', 'loading', 'in_transit'].includes(c.status)
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Driver'}`}
        description="Your cargo and route overview"
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowReport(true)}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Report
          </Button>
        }
      />

      {activeCargoes.length > 0 && (
        <div className="mb-6 pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-silk-gold-dark" />
              <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Active Shipments</h3>
            </div>
            <Link to="/map">
              <Button variant="ghost" size="sm">
                View on Map <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {activeCargoes.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border-b border-silk-gold/10 pb-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-kazakh-burgundy dark:text-silk-gold truncate">
                    #{c.id} {c.cargo_type}
                  </p>
                  <p className="text-xs text-modern-slate dark:text-warm-sand">
                    {c.origin} &rarr; {c.destination}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === 'in_transit' ? 'bg-caspian-teal/20 text-caspian-teal' : 'bg-silk-gold/20 text-silk-gold-dark'
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
        <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-8 text-center shadow-sm">
          <Package className="w-10 h-10 text-silk-gold/40 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold mb-1 font-serif">No shipments assigned</h3>
          <p className="text-xs text-modern-slate dark:text-warm-sand mb-4">You don't have any cargo assigned yet. Check the map to view port activity.</p>
          <Link to="/map">
            <Button size="sm">
              <Map className="w-4 h-4" />
              Open Port Map
            </Button>
          </Link>
        </div>
      )}

      {myCargoes.length > 0 && activeCargoes.length === 0 && (
        <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
          <p className="text-sm text-modern-slate dark:text-warm-sand text-center py-4">No active shipments in transit.</p>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <TransitRoutesTable />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ParkingGrid />
          <BerthGrid />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Ship className="w-4 h-4 text-silk-gold-dark" />
          <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Route Planning</h3>
        </div>
        <RouteChatbot />
      </div>

      <ReportIncidentModal open={showReport} onClose={() => setShowReport(false)} />
    </div>
  )
}
