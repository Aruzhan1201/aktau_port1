import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/cards/StatCard'
import { ReportIncidentModal } from '@/components/incidents/ReportIncidentModal'
import { ROUTES } from '@/lib/constants'
import { Package, HandshakeIcon, Map, AlertTriangle, Plus, Bot } from 'lucide-react'

export function ClientDashboard() {
  const navigate = useNavigate()
  const [trackId, setTrackId] = useState('')
  const [showReport, setShowReport] = useState(false)

  const { data: cargoes } = useQuery({
    queryKey: ['my-cargoes'],
    queryFn: () => api.get('/cargo', { params: { skip: 0, limit: 10 } }).then((r) => r.data),
  })

  const { data: deals } = useQuery({
    queryKey: ['my-deals'],
    queryFn: () => api.get('/deals').then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kazakh-burgundy dark:text-silk-gold font-serif">Client Dashboard</h1>
          <p className="text-modern-slate dark:text-warm-sand text-sm mt-1 font-sans">Create cargo, track shipments, manage deals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowReport(true)}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Report
          </Button>
          <Button onClick={() => navigate(ROUTES.CARGO_NEW)}>
            <Plus className="w-3.5 h-3.5" />
            New Order
          </Button>
          <Button variant="secondary" onClick={() => navigate(ROUTES.CARGO_AI_ORDER)}>
            <Bot className="w-3.5 h-3.5" />
            AI Order
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-modern-slate/20 pattern-border-diamond rounded-xl border border-silk-gold/30 p-4 flex items-center gap-3">
        <span className="text-sm font-medium text-kazakh-burgundy dark:text-silk-gold whitespace-nowrap font-sans">Track by Cargo ID:</span>
        <Input
          placeholder="Enter cargo ID..."
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { const id = parseInt(trackId, 10); if (!isNaN(id)) navigate(ROUTES.MAP); } }}
          className="max-w-[200px]"
        />
        <Button size="sm" onClick={() => { const id = parseInt(trackId, 10); if (!isNaN(id)) navigate(ROUTES.MAP); }}>
          <Map className="w-3.5 h-3.5" />
          Track
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Active Cargoes"
          value={cargoes?.total ?? <Skeleton className="h-8 w-16" />}
          icon={Package}
          iconColor="bg-caspian-teal/20 text-caspian-teal"
        />
        <StatCard
          label="Active Deals"
          value={deals?.total ?? <Skeleton className="h-8 w-16" />}
          icon={HandshakeIcon}
          iconColor="bg-silk-gold/20 text-silk-gold-dark"
        />
        <StatCard label="Quick Actions" value="" className="space-y-2">
          <div className="mt-2 space-y-2">
            <Button size="sm" className="w-full" onClick={() => navigate(ROUTES.CARGO)}>View Cargo</Button>
            <Button size="sm" className="w-full" variant="secondary" onClick={() => navigate(ROUTES.DEALS)}>View Deals</Button>
            <Button size="sm" className="w-full" variant="outline" onClick={() => navigate(ROUTES.CLIENT_TRACKING)}>Track Shipment</Button>
          </div>
        </StatCard>
      </div>

      <ReportIncidentModal open={showReport} onClose={() => setShowReport(false)} />
    </div>
  )
}
