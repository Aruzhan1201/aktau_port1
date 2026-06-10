import { Link } from 'react-router-dom'
import { useShipList } from '@/hooks/useShip'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Plus, Eye, Ship } from 'lucide-react'
import type { Ship as ShipType } from '@/types'

export function ShipListPage() {
  const { data, isLoading } = useShipList()
  const user = useAuthStore((s) => s.user)

  const columns = [
    { key: 'name', header: 'Name', render: (s: ShipType) => (
      <div className="flex items-center gap-2">
        <Ship className="w-4 h-4 text-slate-400" />
        <span className="font-medium text-slate-800">{s.name}</span>
      </div>
    )},
    { key: 'imo', header: 'IMO', render: (s: ShipType) => <span className="text-slate-500 font-mono text-xs">{s.imo_number || '—'}</span> },
    { key: 'capacity', header: 'Capacity', render: (s: ShipType) => <span className="font-medium">{s.capacity.toLocaleString()}t</span> },
    { key: 'status', header: 'Status', render: (s: ShipType) => {
      const colors: Record<string, string> = {
        available: 'bg-emerald-50 text-emerald-700',
        berthed: 'bg-blue-50 text-blue-700',
        in_transit: 'bg-violet-50 text-violet-700',
        maintenance: 'bg-amber-50 text-amber-700',
      }
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[s.status] || 'bg-slate-50 text-slate-600'}`}>
          {s.status.replace('_', ' ')}
        </span>
      )
    }},
    { key: 'created', header: 'Added', render: (s: ShipType) => <span className="text-slate-500">{formatDate(s.created_at)}</span> },
    { key: 'actions', header: '', className: 'text-right', render: (s: ShipType) => (
      <Link to={`/ships/${s.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
        <Eye className="w-3.5 h-3.5" />
        View
      </Link>
    )},
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ships"
        description="Fleet management"
        actions={user?.role === 'admin' ? (
          <Link to={ROUTES.SHIP_NEW}>
            <Button size="sm">
              <Plus className="w-3.5 h-3.5" />
              New Ship
            </Button>
          </Link>
        ) : undefined}
      />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(s: ShipType) => s.id}
        loading={isLoading}
        emptyMessage="No ships found"
        emptyDescription="Register your first vessel to get started."
      />
    </div>
  )
}
