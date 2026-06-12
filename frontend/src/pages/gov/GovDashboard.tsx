import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { useGovDashboard } from '@/hooks/useGov'
import { useIncidentStats } from '@/hooks/useIncidents'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/cards/StatCard'
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Ship, Clock, Box, Truck, Download, Flag } from 'lucide-react'
import { reportsApi } from '@/api/reports'
import { ROUTES } from '@/lib/constants'
import { ReportIncidentModal } from '@/components/incidents/ReportIncidentModal'
import { Button } from '@/components/ui/button'
import type { GovDashboard as GovDashboardType } from '@/types'

export function GovDashboard() {
  const [port, setPort] = useState<string | undefined>(undefined)
  const [showReport, setShowReport] = useState(false)
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
    { name: 'Occupied', value: d.berth_occupancy.occupied || 0, color: '#6B3C3C' },
    { name: 'Free', value: d.berth_occupancy.free || 0, color: '#27AE60' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Government Dashboard" description="Port performance and safety monitoring">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowReport(true)}>
            <Flag className="w-3.5 h-3.5" />
            Report
          </Button>
          <select value={port || ''} onChange={(e) => setPort(e.target.value || undefined)}
            className="text-sm border border-silk-gold/40 rounded-lg px-3 py-1.5 bg-heritage-cream dark:bg-kazakh-burgundy-dark text-modern-slate dark:text-warm-sand focus:outline-none focus:ring-2 focus:ring-silk-gold">
            <option value="">All Ports</option>
            <option value="aktau">Aktau</option>
            <option value="kuryk">Kuryk</option>
          </select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Throughput (7d)" value={`${d.throughput.total_cargo_7d || 0} cargoes`} icon={Box} iconColor="bg-caspian-teal/20 text-caspian-teal" />
        <StatCard label="Berth Occupancy" value={`${d.berth_occupancy.utilization_pct || 0}%`} icon={Ship} iconColor="bg-silk-gold/20 text-silk-gold-dark" trend={{ value: `${d.berth_occupancy.occupied || 0}/${d.berth_occupancy.total_berths || 0} occupied`, positive: (d.berth_occupancy.utilization_pct || 0) < 80 }} />
        <StatCard label="Avg Delay" value={`${d.delays.average_wait_hours || 0}h`} icon={Clock} iconColor="bg-merchant-copper/20 text-merchant-copper" trend={{ value: `${d.delays.queue_length || 0} in queue`, positive: (d.delays.average_wait_hours || 0) < 2 }} />
        <StatCard label="Incidents (7d)" value={`${d.incidents.total_7d || 0}`} icon={AlertTriangle} iconColor="bg-status-cancelled/20 text-status-cancelled" trend={{ value: `${stats?.resolution_rate_pct || 0}% resolved`, positive: (stats?.resolution_rate_pct || 0) > 50 }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pattern-border-diamond rounded-xl bg-white dark:bg-modern-slate/20 border border-silk-gold/30 shadow-sm p-6">
          <h3 className="font-semibold text-kazakh-burgundy dark:text-silk-gold mb-4 font-serif">Berth Occupancy</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="pattern-border-diamond rounded-xl bg-white dark:bg-modern-slate/20 border border-silk-gold/30 shadow-sm p-6">
          <h3 className="font-semibold text-kazakh-burgundy dark:text-silk-gold mb-4 font-serif">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={() => navigate(ROUTES.GOV_INCIDENTS)}
              className="w-full p-3 rounded-lg bg-heritage-cream dark:bg-kazakh-burgundy-dark hover:bg-silk-gold/20 text-left flex items-center gap-3 transition-colors">
              <AlertTriangle className="w-5 h-5 text-status-cancelled" />
              <div><p className="font-medium text-kazakh-burgundy dark:text-silk-gold">Incident Monitoring</p><p className="text-xs text-modern-slate dark:text-warm-sand">View and manage port incidents</p></div>
            </button>
            <button onClick={() => navigate(ROUTES.GOV_REPORTS)}
              className="w-full p-3 rounded-lg bg-heritage-cream dark:bg-kazakh-burgundy-dark hover:bg-silk-gold/20 text-left flex items-center gap-3 transition-colors">
              <Download className="w-5 h-5 text-caspian-teal" />
              <div><p className="font-medium text-kazakh-burgundy dark:text-silk-gold">Export Reports</p><p className="text-xs text-modern-slate dark:text-warm-sand">Generate CSV/JSON reports</p></div>
            </button>
            <button onClick={() => handleExport('performance')}
              className="w-full p-3 rounded-lg bg-heritage-cream dark:bg-kazakh-burgundy-dark hover:bg-silk-gold/20 text-left flex items-center gap-3 transition-colors">
              <Truck className="w-5 h-5 text-emerald-prosperity" />
              <div><p className="font-medium text-kazakh-burgundy dark:text-silk-gold">Download Performance CSV</p><p className="text-xs text-modern-slate dark:text-warm-sand">Quick export of port KPIs</p></div>
            </button>
          </div>
        </div>
      </div>

      <ReportIncidentModal open={showReport} onClose={() => setShowReport(false)} />
    </div>
  )
}
