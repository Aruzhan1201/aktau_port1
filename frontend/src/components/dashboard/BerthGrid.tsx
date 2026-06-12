import { useBerthList } from '@/hooks/useBerth'
import { Anchor, Ship } from 'lucide-react'
import type { Berth } from '@/types'

const statusConfig: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  free: { border: 'border-green-300', bg: 'bg-green-50', dot: 'bg-green-400', label: 'Free' },
  reserved: { border: 'border-yellow-300', bg: 'bg-yellow-50', dot: 'bg-yellow-400', label: 'Reserved' },
  occupied: { border: 'border-red-300', bg: 'bg-red-50', dot: 'bg-red-400', label: 'Occupied' },
  maintenance: { border: 'border-gray-300', bg: 'bg-gray-50', dot: 'bg-gray-400', label: 'Maintenance' },
}

export function BerthGrid() {
  const { data, isLoading } = useBerthList()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl flex-1" />)}
          </div>
        </div>
      </div>
    )
  }

  const berths: Berth[] = data?.items ?? []
  if (berths.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Anchor className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Berths</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {berths.map((b) => {
          const c = statusConfig[b.status] ?? statusConfig.free
          return (
            <div
              key={b.id}
              className={`${c.bg} ${c.border} border rounded-xl p-3 flex flex-col items-center text-center transition-colors hover:shadow-sm`}
            >
              <Ship className={`w-5 h-5 mb-1 ${b.status === 'free' ? 'text-green-500' : b.status === 'occupied' ? 'text-red-500' : 'text-slate-400'}`} />
              <p className="text-xs font-semibold text-slate-800 truncate w-full">{b.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{b.capacity.toLocaleString()}t</p>
              <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium ${c.dot === 'bg-green-400' ? 'text-green-600' : c.dot === 'bg-red-400' ? 'text-red-600' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                {c.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
