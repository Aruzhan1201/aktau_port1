import { useDashboard } from '@/hooks/useEntities'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonCard } from '@/components/ui/skeleton'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { Package, DollarSign, Anchor, Clock } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#8b5cf6', '#06b6d4', '#22c55e', '#ef4444']

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-slate-600">{payload[0]?.value}</p>
    </div>
  )
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-slate-900">{payload[0]?.name}</p>
      <p className="text-slate-600">{formatCurrency(payload[0]?.value)}</p>
    </div>
  )
}

  const kpis = [
    { key: 'total_cargoes' as const, label: 'Total Cargo', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'total_income' as const, label: 'Revenue', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'berth_utilization_pct' as const, label: 'Berth Utilization', icon: Anchor, color: 'text-amber-600', bg: 'bg-amber-50', suffix: '%' },
    { key: 'average_waiting_time_hours' as const, label: 'Avg Wait Time', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50', fmt: formatDuration },
  ]

export function DashboardPage() {
  const { data, isLoading } = useDashboard()

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Port operations overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 h-72 animate-pulse" />
          <div className="rounded-xl border border-slate-200 bg-white p-5 h-72 animate-pulse" />
        </div>
      </div>
    )
  }

  const statusData = data?.cargoes_by_status
    ? Object.entries(data.cargoes_by_status).map(([name, value]) => ({ name, value }))
    : []

  const incomeData = data?.income_by_type
    ? Object.entries(data.income_by_type).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" description="Port operations overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          let value: string | number = '—'
          if (data) {
            const raw = data[kpi.key]
            value = kpi.fmt ? kpi.fmt(raw as number) : kpi.suffix ? `${raw}${kpi.suffix}` : (raw?.toString() ?? '—')
          }
          return (
            <div
              key={kpi.key}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </p>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Cargoes by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} animationBegin={100} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Revenue by Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <defs>
                {COLORS.map((color, idx) => (
                  <linearGradient key={idx} id={`pieGrad${idx}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={incomeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                label={({ name, percent }: PieLabelRenderProps) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
                animationBegin={200}
              >
                {incomeData.map((_, idx) => (
                  <Cell key={idx} fill={`url(#pieGrad${idx})`} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
