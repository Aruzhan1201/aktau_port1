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
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (allRoutes.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Main Transit Routes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 pr-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</th>
              <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Port</th>
              <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Distance</th>
              <th className="text-left py-2 pl-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
            </tr>
          </thead>
          <tbody>
            {allRoutes.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color_hex }} />
                    <span className="font-medium text-slate-800">{r.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-slate-500 capitalize">{r.port}</td>
                <td className="py-2.5 px-2 text-right text-slate-600 font-medium tabular-nums">
                  {r.distance_km ? `${r.distance_km} km` : '\u2014'}
                </td>
                <td className="py-2.5 pl-2 text-slate-400 text-xs hidden sm:table-cell max-w-xs truncate">
                  {r.description ?? '\u2014'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10b981] mr-1" /> TITR</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3b82f6] mr-1" /> North-South</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f59e0b] mr-1" /> Ferry</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#8b5cf6] mr-1" /> Direct</span>
        <LinkToMap />
      </div>
    </div>
  )
}

function LinkToMap() {
  return (
    <Link to="/map" className="ml-auto text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
      <Map className="w-3 h-3" />
      View Map
    </Link>
  )
}
