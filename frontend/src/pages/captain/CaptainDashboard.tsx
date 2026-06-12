import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useShipList } from '@/hooks/useShip'
import { useCargoList } from '@/hooks/useCargo'
import { useAuthStore } from '@/store/authStore'
import { useDealStore } from '@/store/dealStore'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/cards/StatCard'
import { Ship, Package, HandshakeIcon, Anchor, ArrowRight, FileText, PlusCircle, Map, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { TransitRoutesTable } from '@/components/dashboard/TransitRoutesTable'
import { ParkingGrid } from '@/components/dashboard/ParkingGrid'
import { BerthGrid } from '@/components/dashboard/BerthGrid'
import { RouteChatbot } from '@/components/dashboard/RouteChatbot'
import { ReportIncidentModal } from '@/components/incidents/ReportIncidentModal'

export function CaptainDashboard() {
  const user = useAuthStore((s) => s.user)
  const { data: ships } = useShipList()
  const { data: cargoes } = useCargoList()
  const allDeals = useDealStore((s) => s.deals)
  const deals = useMemo(
    () => allDeals.filter((d) => d.initiatorId === user?.id || d.targetId === user?.id),
    [allDeals, user?.id]
  )

  const myShip = ships?.items?.find((s) => s.captain_id === user?.id)
  const availableCargoes = cargoes?.items?.filter((c) => c.status === 'created' || c.status === 'approved') ?? []
  const activeDeals = deals.filter((d) => d.status === 'pending' || d.status === 'approved')
  const myCargoes = cargoes?.items?.filter((c) => myShip && c.ship_id === myShip.id) ?? []
  const [selectedCargoId, setSelectedCargoId] = useState<number | null>(null)
  const [showReport, setShowReport] = useState(false)
  const navigate = useNavigate()

  const kpis = [
    { label: 'My Ship', value: myShip?.name || 'Not assigned', icon: Ship, iconColor: 'bg-caspian-teal/20 text-caspian-teal', link: myShip ? `/ships/${myShip.id}` : '/ships' },
    { label: 'Open Orders', value: availableCargoes.length, icon: Package, iconColor: 'bg-emerald-prosperity/20 text-emerald-prosperity', link: '/captain/orders' },
    { label: 'Active Deals', value: activeDeals.length, icon: HandshakeIcon, iconColor: 'bg-silk-gold/20 text-silk-gold-dark', link: '/captain/deals' },
    { label: 'Parking', value: 'View Schema', icon: Anchor, iconColor: 'bg-merchant-copper/20 text-merchant-copper', link: '/captain/parking' },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Captain'}`}
        description="Your command center"
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowReport(true)}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Report
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link key={kpi.label} to={kpi.link}>
              <StatCard label={kpi.label} value={kpi.value} icon={Icon} iconColor={kpi.iconColor} />
            </Link>
          )
        })}
      </div>

      <TransitRoutesTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-silk-gold-dark" />
              <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Available Orders</h3>
            </div>
            <Link to="/captain/orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          {availableCargoes.length === 0 ? (
            <p className="text-sm text-modern-slate dark:text-warm-sand text-center py-6">No open orders available right now.</p>
          ) : (
            <div className="space-y-2">
              {availableCargoes.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm border-b border-silk-gold/10 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-kazakh-burgundy dark:text-silk-gold truncate">{c.cargo_type}</p>
                    <p className="text-xs text-modern-slate dark:text-warm-sand">{c.origin} &rarr; {c.destination}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/map?cargo=${c.id}`} className="text-silk-gold-dark hover:text-kazakh-burgundy">
                      <Map className="w-3 h-3" />
                    </Link>
                    <span className="text-xs font-medium text-modern-slate">{c.weight}t</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HandshakeIcon className="w-4 h-4 text-silk-gold-dark" />
              <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Active Deals</h3>
            </div>
            <Link to="/captain/deals">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          {activeDeals.length === 0 ? (
            <p className="text-sm text-modern-slate dark:text-warm-sand text-center py-6">No active deals.</p>
          ) : (
            <div className="space-y-2">
              {activeDeals.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm border-b border-silk-gold/10 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-kazakh-burgundy dark:text-silk-gold truncate">{d.title}</p>
                    <p className="text-xs text-modern-slate dark:text-warm-sand">{d.type.replace('_', ' ')}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    d.status === 'approved' ? 'bg-emerald-prosperity/20 text-emerald-prosperity' : 'bg-silk-gold/20 text-silk-gold-dark'
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!myShip && (
        <div className="mt-6 pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Ship className="w-4 h-4 text-silk-gold-dark" />
            <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">No Ship Assigned</h3>
          </div>
          <p className="text-sm text-modern-slate dark:text-warm-sand mb-4">You don't have a ship yet. Register your vessel to start accepting cargo orders.</p>
          <Link to="/ships/new">
            <Button size="sm">
              <PlusCircle className="w-4 h-4" />
              Register My Ship
            </Button>
          </Link>
        </div>
      )}

      {myShip && (
        <div className="mt-6 pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-silk-gold-dark" />
              <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Ship Documents</h3>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={selectedCargoId ?? ''}
              onChange={(e) => setSelectedCargoId(Number(e.target.value) || null)}
              className="border border-silk-gold/40 rounded-lg px-3 py-2 text-sm bg-heritage-cream dark:bg-kazakh-burgundy-dark text-modern-slate dark:text-warm-sand focus:outline-none focus:ring-2 focus:ring-silk-gold"
            >
              <option value="">Select a cargo to upload documents</option>
              {myCargoes.length > 0 ? myCargoes.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} {c.cargo_type} &mdash; {c.origin} &rarr; {c.destination}
                </option>
              )) : (
                <option disabled>No cargoes assigned to your ship yet</option>
              )}
            </select>
          </div>
          {selectedCargoId && <DocumentUpload cargoId={selectedCargoId} />}
          {!selectedCargoId && (
            <p className="text-xs text-modern-slate dark:text-warm-sand">Select a cargo above to upload verification documents.</p>
          )}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ParkingGrid />
          <BerthGrid />
        </div>
        <RouteChatbot />
      </div>

      <ReportIncidentModal open={showReport} onClose={() => setShowReport(false)} />
    </div>
  )
}
