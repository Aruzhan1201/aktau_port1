import { Link } from 'react-router-dom'
import { useBerthList } from '@/hooks/useBerth'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { BerthStatusBadge } from '@/components/ui/badge'
import { Eye, Anchor } from 'lucide-react'
import type { Berth } from '@/types'

export function BerthListPage() {
  const { data, isLoading } = useBerthList()

  const columns = [
    { key: 'name', header: 'Name', render: (b: Berth) => (
      <div className="flex items-center gap-2">
        <Anchor className="w-4 h-4 text-slate-400" />
        <span className="font-medium text-slate-800">{b.name}</span>
      </div>
    )},
    { key: 'status', header: 'Status', render: (b: Berth) => <BerthStatusBadge status={b.status} /> },
    { key: 'capacity', header: 'Capacity', render: (b: Berth) => <span className="font-medium">{b.capacity.toLocaleString()}t</span> },
    { key: 'manager', header: 'Manager ID', render: (b: Berth) => <span className="text-slate-500">{b.manager_id ?? '—'}</span> },
    { key: 'actions', header: '', className: 'text-right', render: (b: Berth) => (
      <Link to={`/berths/${b.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
        <Eye className="w-3.5 h-3.5" />
        View
      </Link>
    )},
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Berths" description="Dock management" />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(b: Berth) => b.id}
        loading={isLoading}
        emptyMessage="No berths found."
      />
    </div>
  )
}
