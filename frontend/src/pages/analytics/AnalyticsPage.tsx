import { useDashboard, useWaitingTimes, useShipUtilization } from '@/hooks/useEntities'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonCard } from '@/components/ui/skeleton'
import { formatDuration } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Package, Anchor, Clock, BarChart3, TrendingUp, Ship } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#8b5cf6', '#06b6d4', '#22c55e', '#ef4444']

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-slate-600">{payload[0]?.value}</p>
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-slate-900">{payload[0]?.name}</p>
      <p className="text-slate-600">{payload[0]?.value}</p>
    </div>
  )
}

export function AnalyticsPage() {
  const { data: dashboard, isLoading } = useDashboard()
  const { data: waiting } = useWaitingTimes()
  const { data: utilization } = useShipUtilization()

  const statusData = dashboard?.cargoes_by_status
    ? Object.entries(dashboard.cargoes_by_status).map(([name, value]) => ({ name, value }))
    : []

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" description="Port performance metrics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  const kpis = [
    { label: 'Total Cargo', value: dashboard?.total_cargoes ?? 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Berth Utilization', value: `${dashboard?.berth_utilization_pct ?? 0}%`, icon: Anchor, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg Wait Time', value: waiting ? formatDuration(waiting.average_hours) : '—', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Ship Utilization', value: `${utilization?.overall_pct ?? 0}%`, icon: Ship, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" description="Port performance metrics" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Cargoes by Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <defs>
                <linearGradient id="analyticsBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill="url(#analyticsBarGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Revenue Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <defs>
                {COLORS.map((color, idx) => (
                  <linearGradient key={idx} id={`analyticsPieGrad${idx}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
              <Pie data={statusData.slice(0, 5)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label>
                {statusData.slice(0, 5).map((_, idx) => <Cell key={idx} fill={`url(#analyticsPieGrad${idx})`} stroke="none" />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Waiting Times</h3>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-3xl font-bold text-slate-900">{waiting ? formatDuration(waiting.average_hours) : '—'}</p>
              <p className="text-xs text-slate-500 mt-1">Average wait</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-700">{waiting ? formatDuration(waiting.max_hours) : '—'}</p>
              <p className="text-xs text-slate-500 mt-1">Maximum</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-700">{waiting ? formatDuration(waiting.min_hours) : '—'}</p>
              <p className="text-xs text-slate-500 mt-1">Minimum</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Ship className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Ship Utilization</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${utilization?.overall_pct ?? 0} ${100 - (utilization?.overall_pct ?? 0)}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
                {utilization?.overall_pct ?? 0}%
              </span>
            </div>
            <div className="text-sm text-slate-500">
              <p>Overall fleet utilization rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
