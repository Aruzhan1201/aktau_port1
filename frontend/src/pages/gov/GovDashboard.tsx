import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { useGovDashboard } from '@/hooks/useGov'
import { useIncidentStats } from '@/hooks/useIncidents'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Ship, Clock, Box, Truck, Download } from 'lucide-react'
import { reportsApi } from '@/api/reports'
import { ROUTES } from '@/lib/constants'
import type { GovDashboard as GovDashboardType } from '@/types'

export function GovDashboard() {
  const [port, setPort] = useState<string | undefined>(undefined)
  const navigate = useNavigate()
  const { data: dashboard, isLoading } = useGovDashboard(port)
  const { data: stats } = useIncidentStats(port)

  const handleExport = async (type: string) => {
    try {
      const blob = await reportsApi.export(port || 'aktau', type, 'csv', 30)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${type}_report.csv`; a.click()
      window.URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  if (isLoading) return <Skeleton className="h-96" />

  const d = (dashboard || {
    throughput: { total_cargo_7d: 0, ro_ro_vehicles_7d: 0 },
    berth_occupancy: { total_berths: 0, occupied: 0, free: 0, utilization_pct: 0 },
    delays: { average_wait_hours: 0, queue_length: 0, delayed_cargoes: 0 },
    incidents: { total_7d: 0 },
  }) as GovDashboardType
  const pieData = [
    { name: 'Occupied', value: d.berth_occupancy.occupied || 0 },
    { name: 'Free', value: d.berth_occupancy.free || 0 },
  ]
  const COLORS = ['#ef4444', '#22c55e']

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Government Dashboard" description="Port performance and safety monitoring">
        <select value={port || ''} onChange={(e) => setPort(e.target.value || undefined)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
          <option value="">All Ports</option>
          <option value="aktau">Aktau</option>
          <option value="kuryk">Kuryk</option>
        </select>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2"><Box className="w-4 h-4" /><span className="text-xs font-medium">Throughput (7d)</span></div>
          <p className="text-2xl font-bold text-slate-800">{d.throughput.total_cargo_7d || 0}</p>
          <p className="text-xs text-slate-500">cargoes</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-2"><Ship className="w-4 h-4" /><span className="text-xs font-medium">Berth Occupancy</span></div>
          <p className="text-2xl font-bold text-slate-800">{d.berth_occupancy.utilization_pct || 0}%</p>
          <p className="text-xs text-slate-500">{d.berth_occupancy.occupied || 0}/{d.berth_occupancy.total_berths || 0} occupied</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-2"><Clock className="w-4 h-4" /><span className="text-xs font-medium">Avg Delay</span></div>
          <p className="text-2xl font-bold text-slate-800">{d.delays.average_wait_hours || 0}h</p>
          <p className="text-xs text-slate-500">{d.delays.queue_length || 0} in queue</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-2"><AlertTriangle className="w-4 h-4" /><span className="text-xs font-medium">Incidents (7d)</span></div>
          <p className="text-2xl font-bold text-slate-800">{d.incidents.total_7d || 0}</p>
          <p className="text-xs text-slate-500">{stats?.resolution_rate_pct || 0}% resolved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Berth Occupancy</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={() => navigate(ROUTES.GOV_INCIDENTS)}
              className="w-full p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-left flex items-center gap-3 transition-colors">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div><p className="font-medium text-slate-800">Incident Monitoring</p><p className="text-xs text-slate-500">View and manage port incidents</p></div>
            </button>
            <button onClick={() => navigate(ROUTES.GOV_REPORTS)}
              className="w-full p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-left flex items-center gap-3 transition-colors">
              <Download className="w-5 h-5 text-blue-500" />
              <div><p className="font-medium text-slate-800">Export Reports</p><p className="text-xs text-slate-500">Generate CSV/JSON reports</p></div>
            </button>
            <button onClick={() => handleExport('performance')}
              className="w-full p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-left flex items-center gap-3 transition-colors">
              <Truck className="w-5 h-5 text-green-500" />
              <div><p className="font-medium text-slate-800">Download Performance CSV</p><p className="text-xs text-slate-500">Quick export of port KPIs</p></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
