import { Link } from 'react-router-dom'
import { useCargoList } from '@/hooks/useCargo'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { formatDate, formatWeight } from '@/lib/utils'
import { Plus, Sparkles, Eye } from 'lucide-react'
import type { Cargo } from '@/types'

export function CargoListPage() {
  const { data, isLoading } = useCargoList()
  const user = useAuthStore((s) => s.user)

  const columns = [
    { key: 'id', header: 'ID', render: (c: Cargo) => <span className="font-mono text-xs text-slate-400">#{c.id}</span> },
    { key: 'cargo_type', header: 'Type', render: (c: Cargo) => <span className="font-medium text-slate-800">{c.cargo_type}</span> },
    { key: 'weight', header: 'Weight', render: (c: Cargo) => <span className="text-slate-600">{formatWeight(c.weight)}</span> },
    { key: 'origin', header: 'Origin', render: (c: Cargo) => c.origin },
    { key: 'destination', header: 'Destination', render: (c: Cargo) => c.destination },
    { key: 'status', header: 'Status', render: (c: Cargo) => <StatusBadge status={c.status} /> },
    { key: 'created_at', header: 'Created', render: (c: Cargo) => <span className="text-slate-500">{formatDate(c.created_at)}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (c: Cargo) => (
        <Link
          to={`/cargo/${c.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Link>
      ),
    },
  ]

  const canCreate = user && (user.role === 'client' || user.role === 'admin')

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Cargo"
        description={`${data?.total ?? 0} total shipments`}
        actions={
          canCreate ? (
            <div className="flex gap-2">
              <Link to={ROUTES.CARGO_AI_ORDER}>
                <Button variant="outline" size="sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Order
                </Button>
              </Link>
              <Link to={ROUTES.CARGO_NEW}>
                <Button size="sm">
                  <Plus className="w-3.5 h-3.5" />
                  New Cargo
                </Button>
              </Link>
            </div>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(c: Cargo) => c.id}
        loading={isLoading}
        emptyMessage="No cargo shipments found"
        emptyDescription="Create your first shipment to get started."
      />
    </div>
  )
}
