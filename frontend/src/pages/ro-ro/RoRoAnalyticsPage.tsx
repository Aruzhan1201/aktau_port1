import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { useRoRoKpis, useRoRoAnalytics } from '@/hooks/useRoRo'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function RoRoAnalyticsPage() {
  const [port, setPort] = useState('aktau')
  const { data: kpis, isLoading } = useRoRoKpis({ port, days: 7 })
  const { data: analytics } = useRoRoAnalytics(port)

  if (isLoading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Ro-Ro Analytics" description="Vehicle processing KPIs and trends">
        <select value={port} onChange={(e) => setPort(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
          <option value="aktau">Aktau</option><option value="kuryk">Kuryk</option>
        </select>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Total Vehicles (7d)</p>
          <p className="text-2xl font-bold text-slate-800">{kpis?.total_vehicles || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Exited</p>
          <p className="text-2xl font-bold text-green-600">{kpis?.exited_vehicles || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Avg Processing Time</p>
          <p className="text-2xl font-bold text-amber-600">{kpis?.average_processing_hours || 0}h</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Target Achievement</p>
          <p className="text-2xl font-bold text-blue-600">{analytics?.planned_vs_actual?.achievement_pct || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Daily Throughput</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={kpis?.daily_throughput || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Vehicles" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Planned vs Actual</h3>
          {analytics?.planned_vs_actual ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <span className="text-sm font-medium">Planned</span>
                <span className="font-bold">{analytics.planned_vs_actual.planned}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-sm font-medium">Actual</span>
                <span className="font-bold">{analytics.planned_vs_actual.actual}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                <span className="text-sm font-medium">Achievement</span>
                <span className="font-bold">{analytics.planned_vs_actual.achievement_pct}%</span>
              </div>
            </div>
          ) : <p className="text-sm text-slate-500">No data</p>}
        </div>
      </div>
    </div>
  )
}
