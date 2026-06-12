import { useBerthList } from '@/hooks/useBerth'
import { Anchor, Ship } from 'lucide-react'
import type { Berth } from '@/types'

const statusConfig: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  free: { border: 'border-emerald-prosperity/40', bg: 'bg-emerald-prosperity/10', dot: 'bg-emerald-prosperity', label: 'Free' },
  reserved: { border: 'border-silk-gold/50', bg: 'bg-silk-gold/20', dot: 'bg-silk-gold', label: 'Reserved' },
  occupied: { border: 'border-status-cancelled/40', bg: 'bg-status-cancelled/10', dot: 'bg-status-cancelled', label: 'Occupied' },
  maintenance: { border: 'border-modern-slate/30', bg: 'bg-modern-slate/10', dot: 'bg-modern-slate', label: 'Maintenance' },
}

export function BerthGrid() {
  const { data, isLoading } = useBerthList()

  if (isLoading) {
    return (
      <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-silk-gold/30 rounded w-1/4" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-silk-gold/20 rounded-xl flex-1" />)}
          </div>
        </div>
      </div>
    )
  }

  const berths: Berth[] = data?.items ?? []
  if (berths.length === 0) return null

  return (
    <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Anchor className="w-4 h-4 text-silk-gold-dark" />
        <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Berths</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {berths.map((b) => {
          const c = statusConfig[b.status] ?? statusConfig.free
          return (
            <div
              key={b.id}
              className={`${c.bg} ${c.border} border rounded-xl p-3 flex flex-col items-center text-center transition-colors hover:shadow-sm`}
            >
              <Ship className={`w-5 h-5 mb-1 ${b.status === 'free' ? 'text-emerald-prosperity' : b.status === 'occupied' ? 'text-status-cancelled' : b.status === 'reserved' ? 'text-silk-gold-dark' : 'text-modern-slate'}`} />
              <p className="text-xs font-semibold text-kazakh-burgundy dark:text-silk-gold truncate w-full">{b.name}</p>
              <p className="text-[10px] text-modern-slate dark:text-warm-sand mt-0.5">{b.capacity.toLocaleString()}t</p>
              <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium ${
                c.dot === 'bg-emerald-prosperity' ? 'text-emerald-prosperity' : 
                c.dot === 'bg-status-cancelled' ? 'text-status-cancelled' : 
                c.dot === 'bg-silk-gold' ? 'text-silk-gold-dark' : 'text-modern-slate'
              }`}>
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
