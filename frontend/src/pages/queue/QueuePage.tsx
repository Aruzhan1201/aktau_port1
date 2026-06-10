import { useQueue, useProcessQueue } from '@/hooks/useEntities'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Play } from 'lucide-react'
import type { PortQueueItem } from '@/types'

export function QueuePage() {
  const { data, isLoading } = useQueue()
  const processQueue = useProcessQueue()

  const columns = [
    { key: 'id', header: '#', render: (q: PortQueueItem) => <span className="font-mono text-xs text-slate-400">{q.id}</span> },
    { key: 'cargo', header: 'Cargo', render: (q: PortQueueItem) => <span className="font-medium">#{q.cargo_id}</span> },
    { key: 'type', header: 'Type', render: (q: PortQueueItem) => q.cargo_type || '—' },
    { key: 'weight', header: 'Weight', render: (q: PortQueueItem) => q.weight ? <span className="text-slate-600">{q.weight}t</span> : '—' },
    { key: 'priority', header: 'Priority', render: (q: PortQueueItem) => {
      const p = q.priority_score
      const color = p >= 8 ? 'text-red-600' : p >= 5 ? 'text-amber-600' : 'text-slate-600'
      return <span className={`font-semibold ${color}`}>{p.toFixed(1)}</span>
    }},
    { key: 'status', header: 'Status', render: (q: PortQueueItem) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        q.status === 'waiting' ? 'bg-amber-50 text-amber-700' :
        q.status === 'assigned' ? 'bg-blue-50 text-blue-700' :
        'bg-emerald-50 text-emerald-700'
      }`}>
        {q.status}
      </span>
    )},
    { key: 'entered', header: 'Waiting Since', render: (q: PortQueueItem) => <span className="text-slate-500">{formatDate(q.entered_at)}</span> },
  ]

  const waitingCount = (data as { waiting?: number })?.waiting ?? data?.items?.length ?? 0

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Port Queue"
        description={`${waitingCount} item${waitingCount !== 1 ? 's' : ''} waiting`}
        actions={
          <Button onClick={() => processQueue.mutate()} loading={processQueue.isPending} size="sm">
            <Play className="w-3.5 h-3.5" />
            Process Next
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(q: PortQueueItem) => q.id}
        loading={isLoading}
        emptyMessage="Queue is empty"
        emptyDescription="All items have been processed."
      />
    </div>
  )
}
