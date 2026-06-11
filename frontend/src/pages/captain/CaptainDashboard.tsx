import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useShipList } from '@/hooks/useShip'
import { useCargoList } from '@/hooks/useCargo'
import { useAuthStore } from '@/store/authStore'
import { useDealStore } from '@/store/dealStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Ship, Package, HandshakeIcon, Anchor, ArrowRight, FileText, PlusCircle, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentUpload } from '@/components/documents/DocumentUpload'

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
  const navigate = useNavigate()

  const kpis = [
    { label: 'My Ship', value: myShip?.name || 'Not assigned', icon: Ship, color: 'text-blue-600', bg: 'bg-blue-50', link: myShip ? `/ships/${myShip.id}` : '/ships' },
    { label: 'Open Orders', value: availableCargoes.length, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/captain/orders' },
    { label: 'Active Deals', value: activeDeals.length, icon: HandshakeIcon, color: 'text-amber-600', bg: 'bg-amber-50', link: '/captain/deals' },
    { label: 'Parking', value: 'View Schema', icon: Anchor, color: 'text-violet-600', bg: 'bg-violet-50', link: '/captain/parking' },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Captain'}`}
        description="Your command center"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link key={kpi.label} to={kpi.link}>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                  <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-900 truncate">{typeof kpi.value === 'number' ? kpi.value : kpi.value}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Available Orders</h3>
            </div>
            <Link to="/captain/orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          {availableCargoes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No open orders available right now.</p>
          ) : (
            <div className="space-y-2">
              {availableCargoes.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{c.cargo_type}</p>
                    <p className="text-xs text-slate-400">{c.origin} → {c.destination}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/map?cargo=${c.id}`} className="text-blue-500 hover:text-blue-700">
                      <Map className="w-3 h-3" />
                    </Link>
                    <span className="text-xs font-medium text-slate-500">{c.weight}t</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HandshakeIcon className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Active Deals</h3>
            </div>
            <Link to="/captain/deals">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          {activeDeals.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No active deals.</p>
          ) : (
            <div className="space-y-2">
              {activeDeals.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{d.title}</p>
                    <p className="text-xs text-slate-400">{d.type.replace('_', ' ')}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    d.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Register Ship section */}
      {!myShip && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Ship className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">No Ship Assigned</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">You don't have a ship yet. Register your vessel to start accepting cargo orders.</p>
          <Link to="/ships/new">
            <Button size="sm">
              <PlusCircle className="w-4 h-4" />
              Register My Ship
            </Button>
          </Link>
        </div>
      )}

      {/* Documents section */}
      {myShip && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Ship Documents</h3>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={selectedCargoId ?? ''}
              onChange={(e) => setSelectedCargoId(Number(e.target.value) || null)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a cargo to upload documents</option>
              {myCargoes.length > 0 ? myCargoes.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} {c.cargo_type} — {c.origin} → {c.destination}
                </option>
              )) : (
                <option disabled>No cargoes assigned to your ship yet</option>
              )}
            </select>
          </div>
          {selectedCargoId && <DocumentUpload cargoId={selectedCargoId} />}
          {!selectedCargoId && (
            <p className="text-xs text-slate-400">Select a cargo above to upload verification documents.</p>
          )}
        </div>
      )}
    </div>
  )
}
