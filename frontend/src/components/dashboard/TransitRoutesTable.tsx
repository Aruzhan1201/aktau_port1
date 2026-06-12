import { Link } from 'react-router-dom'
import { usePortMapRoutes } from '@/hooks/useOther'
import { Map, Route } from 'lucide-react'
import type { TransitRoute } from '@/types'

export function TransitRoutesTable() {
  const { data: aktauRoutes, isLoading: loadingA } = usePortMapRoutes('aktau')
  const { data: kurykRoutes, isLoading: loadingB } = usePortMapRoutes('kuryk')

  const allRoutes = [...(aktauRoutes ?? []), ...(kurykRoutes ?? [])] as TransitRoute[]

  if (loadingA || loadingB) {
    return (
      <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-silk-gold/30 rounded w-1/3" />
          <div className="h-10 bg-silk-gold/20 rounded" />
          <div className="h-10 bg-silk-gold/20 rounded" />
        </div>
      </div>
    )
  }

  if (allRoutes.length === 0) return null

  return (
    <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-4 h-4 text-silk-gold-dark" />
        <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Main Transit Routes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-silk-gold/20">
              <th className="text-left py-2 pr-2 text-xs font-semibold text-modern-slate dark:text-warm-sand uppercase tracking-wider font-sans">Route</th>
              <th className="text-left py-2 px-2 text-xs font-semibold text-modern-slate dark:text-warm-sand uppercase tracking-wider font-sans">Port</th>
              <th className="text-right py-2 px-2 text-xs font-semibold text-modern-slate dark:text-warm-sand uppercase tracking-wider font-sans">Distance</th>
              <th className="text-left py-2 pl-2 text-xs font-semibold text-modern-slate dark:text-warm-sand uppercase tracking-wider hidden sm:table-cell font-sans">Description</th>
            </tr>
          </thead>
          <tbody>
            {allRoutes.map((r) => (
              <tr key={r.id} className="border-b border-silk-gold/10 hover:bg-silk-gold/10 transition-colors">
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color_hex }} />
                    <span className="font-medium text-kazakh-burgundy dark:text-silk-gold">{r.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-modern-slate dark:text-warm-sand capitalize">{r.port}</td>
                <td className="py-2.5 px-2 text-right text-modern-slate dark:text-warm-sand font-medium tabular-nums">
                  {r.distance_km ? `${r.distance_km} km` : '\u2014'}
                </td>
                <td className="py-2.5 pl-2 text-modern-slate dark:text-warm-sand/70 text-xs hidden sm:table-cell max-w-xs truncate">
                  {r.description ?? '\u2014'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-modern-slate dark:text-warm-sand flex-wrap">
        {allRoutes.map((r) => (
          <span key={r.id}>
            <span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: r.color_hex }} />
            {r.name}
          </span>
        ))}
        <Link to="/map" className="ml-auto text-silk-gold-dark hover:text-kazakh-burgundy dark:hover:text-silk-gold font-medium flex items-center gap-1">
          <Map className="w-3 h-3" />
          View Map
        </Link>
      </div>
    </div>
  )
}
