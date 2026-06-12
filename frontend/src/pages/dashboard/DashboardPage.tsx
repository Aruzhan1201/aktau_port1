import { useState } from 'react'
import { useDashboard } from '@/hooks/useEntities'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/cards/StatCard'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ReportIncidentModal } from '@/components/incidents/ReportIncidentModal'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { Package, DollarSign, Anchor, Clock, AlertTriangle } from 'lucide-react'
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

const CHART_COLORS = ['#6B3C3C', '#D4A574', '#2B7A78', '#27AE60', '#B87333', '#E8D7C3', '#4A2A2A', '#1B5A58']

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white dark:bg-modern-slate rounded-lg border border-silk-gold/30 shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-kazakh-burgundy dark:text-silk-gold">{label}</p>
      <p className="text-modern-slate dark:text-warm-sand">{payload[0]?.value}</p>
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white dark:bg-modern-slate rounded-lg border border-silk-gold/30 shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-kazakh-burgundy dark:text-silk-gold">{payload[0]?.name}</p>
      <p className="text-modern-slate dark:text-warm-sand">{formatCurrency(payload[0]?.value)}</p>
    </div>
  )
}

export function DashboardPage() {
  const { data, isLoading } = useDashboard()
  const [showIncidentForm, setShowIncidentForm] = useState(false)

  const kpis = [
    { key: 'total_cargoes' as const, label: 'Total Cargo', icon: Package, iconColor: 'bg-caspian-teal/20 text-caspian-teal' },
    { key: 'total_income' as const, label: 'Revenue', icon: DollarSign, iconColor: 'bg-emerald-prosperity/20 text-emerald-prosperity' },
    { key: 'berth_utilization_pct' as const, label: 'Berth Utilization', icon: Anchor, iconColor: 'bg-silk-gold/20 text-silk-gold-dark', suffix: '%' },
    { key: 'average_waiting_time_hours' as const, label: 'Avg Wait Time', icon: Clock, iconColor: 'bg-merchant-copper/20 text-merchant-copper', fmt: formatDuration },
  ]

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Dashboard" description="Port operations overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 h-72 animate-pulse" />
          <div className="rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 h-72 animate-pulse" />
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
      <PageHeader
        title="Dashboard"
        description="Port operations overview"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          let value: string | number = '—'
          if (data) {
            const raw = data[kpi.key]
            value = kpi.fmt ? kpi.fmt(raw as number) : kpi.suffix ? `${raw}${kpi.suffix}` : (raw?.toString() ?? '—')
          }
          return (
            <StatCard key={kpi.key} label={kpi.label} value={value} icon={Icon} iconColor={kpi.iconColor} />
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold mb-4 font-serif">Cargoes by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B3C3C" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#D4A574" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8D7C3" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5A6A7C' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5A6A7C' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} animationBegin={100} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold mb-4 font-serif">Revenue by Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
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
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
