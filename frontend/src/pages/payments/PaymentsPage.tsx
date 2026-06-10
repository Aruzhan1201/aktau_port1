import { useState } from 'react'
import { usePayments, useRevenue, useCreatePayment, useMarkPaymentPaid } from '@/hooks/useEntities'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { PaymentBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Plus, DollarSign, TrendingUp, AlertTriangle, CreditCard, X } from 'lucide-react'
import type { Payment } from '@/types'

const paymentTypeOptions = [
  { value: 'cargo_fee', label: 'Cargo Fee' },
  { value: 'berth_fee', label: 'Berth Fee' },
  { value: 'penalty', label: 'Penalty' },
]

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-slate-600">{formatCurrency(payload[0]?.value)}</p>
    </div>
  )
}

export function PaymentsPage() {
  const { data, isLoading } = usePayments()
  const { data: revenue } = useRevenue()
  const create = useCreatePayment()
  const markPaid = useMarkPaymentPaid()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'cargo_fee', amount: '', cargo_id: '', reservation_id: '' })

  const columns = [
    { key: 'id', header: 'ID', render: (p: Payment) => <span className="font-mono text-xs text-slate-400">#{p.id}</span> },
    { key: 'type', header: 'Type', render: (p: Payment) => (
      <span className="capitalize text-slate-700">{p.type.replace('_', ' ')}</span>
    )},
    { key: 'amount', header: 'Amount', render: (p: Payment) => <span className="font-semibold text-slate-900">{formatCurrency(p.amount, p.currency)}</span> },
    { key: 'status', header: 'Status', render: (p: Payment) => <PaymentBadge status={p.status} /> },
    { key: 'created', header: 'Created', render: (p: Payment) => <span className="text-slate-500">{formatDate(p.created_at)}</span> },
    { key: 'actions', header: '', className: 'text-right', render: (p: Payment) =>
      p.status === 'pending' ? (
        <Button size="sm" variant="primary" onClick={() => markPaid.mutate(p.id)} loading={markPaid.isPending}>
          Mark Paid
        </Button>
      ) : null
    },
  ]

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync({
      type: form.type as 'cargo_fee' | 'berth_fee' | 'penalty',
      amount: Number(form.amount),
      cargo_id: form.cargo_id ? Number(form.cargo_id) : undefined,
      reservation_id: form.reservation_id ? Number(form.reservation_id) : undefined,
    })
    setShowForm(false)
    setForm({ type: 'cargo_fee', amount: '', cargo_id: '', reservation_id: '' })
  }

  const revenueData = revenue
    ? [
        { name: 'Cargo Fees', value: revenue.cargo_fees },
        { name: 'Berth Fees', value: revenue.berth_fees },
        { name: 'Penalties', value: revenue.penalties },
      ]
    : []

  const kpiCards = revenue ? [
    { label: 'Total Income', value: formatCurrency(revenue.total_income), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Paid', value: formatCurrency(revenue.total_paid), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Pending', value: formatCurrency(revenue.total_pending), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ] : []

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payments"
        description="Transaction ledger"
        actions={
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'New Payment'}
          </Button>
        }
      />
      {kpiCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                  <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
              </div>
            )
          })}
        </div>
      )}
      {revenueData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Revenue Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill="url(#revenueGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-5 mb-4 max-w-md shadow-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Create Payment</h3>
          </div>
          <div className="space-y-3">
            <Select id="type" label="Payment Type" options={paymentTypeOptions} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <Input id="amount" label="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Input id="cargo_id" label="Cargo ID (optional)" type="number" value={form.cargo_id} onChange={(e) => setForm({ ...form, cargo_id: e.target.value })} />
            <Input id="reservation_id" label="Reservation ID (optional)" type="number" value={form.reservation_id} onChange={(e) => setForm({ ...form, reservation_id: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <Button type="submit" loading={create.isPending} size="sm">
              <Plus className="w-3.5 h-3.5" />
              Create Payment
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(p: Payment) => p.id}
        loading={isLoading}
        emptyMessage="No payments found"
        emptyDescription="Transactions will appear here once created."
      />
    </div>
  )
}
