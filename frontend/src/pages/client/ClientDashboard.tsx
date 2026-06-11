import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/constants'

export function ClientDashboard() {
  const navigate = useNavigate()
  const [trackId, setTrackId] = useState('')

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
          <h1 className="text-2xl font-bold text-slate-800">Client Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Create cargo, track shipments, manage deals</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(ROUTES.CARGO_NEW)}>New Order</Button>
          <Button variant="outline" onClick={() => navigate(ROUTES.CARGO_AI_ORDER)}>AI Order</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Track by Cargo ID:</span>
        <Input
          placeholder="Enter cargo ID..."
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { const id = parseInt(trackId, 10); if (!isNaN(id)) navigate(ROUTES.MAP); } }}
          className="max-w-[200px]"
        />
        <Button size="sm" onClick={() => { const id = parseInt(trackId, 10); if (!isNaN(id)) navigate(ROUTES.MAP); }}>
          Track
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">Active Cargoes</div>
          <div className="text-3xl font-bold mt-1">{cargoes?.total ?? <Skeleton className="h-8 w-16" />}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">Active Deals</div>
          <div className="text-3xl font-bold mt-1">{deals?.total ?? <Skeleton className="h-8 w-16" />}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">Quick Actions</div>
          <div className="mt-2 space-y-2">
            <Button size="sm" className="w-full" onClick={() => navigate(ROUTES.CARGO)}>View Cargo</Button>
            <Button size="sm" className="w-full" variant="outline" onClick={() => navigate(ROUTES.DEALS)}>View Deals</Button>
            <Button size="sm" className="w-full" variant="outline" onClick={() => navigate(ROUTES.CLIENT_TRACKING)}>Track Shipment</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
