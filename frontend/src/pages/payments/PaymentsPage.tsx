import { useState } from 'react'
import { usePayments, useRevenue, useCreatePayment, useMarkPaymentPaid } from '@/hooks/useEntities'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { PaymentBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { StatCard } from '@/components/cards/StatCard'
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
    <div className="bg-white dark:bg-modern-slate rounded-lg border border-silk-gold/30 shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-kazakh-burgundy dark:text-silk-gold">{label}</p>
      <p className="text-modern-slate dark:text-warm-sand">{formatCurrency(payload[0]?.value)}</p>
    </div>
  )
}

export function PaymentsPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const { data, isLoading } = usePayments()
  const { data: revenue } = useRevenue()
  const create = useCreatePayment()
  const markPaid = useMarkPaymentPaid()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'cargo_fee', amount: '', cargo_id: '', reservation_id: '', bank_name: '', bank_account: '', payment_method: '', reference_number: '' })

  const columns = [
    { key: 'id', header: 'ID', render: (p: Payment) => <span className="font-mono text-xs text-modern-slate dark:text-warm-sand">#{p.id}</span> },
    { key: 'type', header: 'Type', render: (p: Payment) => (
      <span className="capitalize text-kazakh-burgundy dark:text-silk-gold">{p.type.replace('_', ' ')}</span>
    )},
    { key: 'amount', header: 'Amount', render: (p: Payment) => <span className="font-semibold text-kazakh-burgundy dark:text-silk-gold">{formatCurrency(p.amount, p.currency)}</span> },
    { key: 'status', header: 'Status', render: (p: Payment) => <PaymentBadge status={p.status} /> },
    { key: 'bank', header: 'Bank', render: (p: Payment) => (
      <span className="text-modern-slate dark:text-warm-sand text-sm">{p.bank_name || '—'}</span>
    )},
    { key: 'payment_method', header: 'Method', render: (p: Payment) => (
      <span className="text-modern-slate dark:text-warm-sand text-xs capitalize">{p.payment_method?.replace('_', ' ') || '—'}</span>
    )},
    { key: 'reference', header: 'Reference', render: (p: Payment) => (
      <span className="font-mono text-xs text-modern-slate dark:text-warm-sand">{p.reference_number || '—'}</span>
    )},
    { key: 'created', header: 'Created', render: (p: Payment) => <span className="text-modern-slate dark:text-warm-sand">{formatDate(p.created_at)}</span> },
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
      bank_name: form.bank_name || undefined,
      bank_account: form.bank_account || undefined,
      payment_method: form.payment_method || undefined,
      reference_number: form.reference_number || undefined,
    })
    setShowForm(false)
    setForm({ type: 'cargo_fee', amount: '', cargo_id: '', reservation_id: '', bank_name: '', bank_account: '', payment_method: '', reference_number: '' })
  }

  const revenueData = revenue
    ? [
        { name: 'Cargo Fees', value: revenue.cargo_fees },
        { name: 'Berth Fees', value: revenue.berth_fees },
        { name: 'Penalties', value: revenue.penalties },
      ]
    : []

  const kpiCards = revenue ? [
    { label: 'Total Income', value: formatCurrency(revenue.total_income), icon: DollarSign, iconColor: 'bg-emerald-prosperity/20 text-emerald-prosperity' },
    { label: 'Total Paid', value: formatCurrency(revenue.total_paid), icon: TrendingUp, iconColor: 'bg-caspian-teal/20 text-caspian-teal' },
    { label: 'Total Pending', value: formatCurrency(revenue.total_pending), icon: AlertTriangle, iconColor: 'bg-silk-gold/20 text-silk-gold-dark' },
  ] : []

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payments"
        description={isAdmin ? "Transaction ledger" : "Your payments"}
        actions={
          isAdmin ? (
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showForm ? 'Cancel' : 'New Payment'}
            </Button>
          ) : undefined
        }
      />
      {isAdmin && kpiCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon
            return (
              <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={Icon} iconColor={kpi.iconColor} />
            )
          })}
        </div>
      )}
      {isAdmin && revenueData.length > 0 && (
        <div className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-silk-gold-dark" />
            <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Revenue Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A574" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#2B7A78" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8D7C3" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5A6A7C' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="value" tick={{ fontSize: 11, fill: '#5A6A7C' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill="url(#revenueGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {isAdmin && showForm && (
        <form onSubmit={handleCreate} className="pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 mb-4 max-w-lg shadow-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-silk-gold-dark" />
            <h3 className="text-sm font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">Create Payment</h3>
          </div>
          <div className="space-y-3">
            <Select id="type" label="Payment Type" options={paymentTypeOptions} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <Input id="amount" label="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Input id="bank_name" label="Bank Name" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. Halyk Bank" />
            <Input id="bank_account" label="Bank Account" value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} placeholder="e.g. KZ1234567890" />
            <Select id="payment_method" label="Payment Method" options={[{ value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'card', label: 'Card' }, { value: 'cash', label: 'Cash' }]} value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} />
            <Input id="reference_number" label="Reference Number" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} placeholder="e.g. INV-2024-001" />
            <Input id="cargo_id" label="Cargo ID (optional)" type="number" value={form.cargo_id} onChange={(e) => setForm({ ...form, cargo_id: e.target.value })} />
            <Input id="reservation_id" label="Reservation ID (optional)" type="number" value={form.reservation_id} onChange={(e) => setForm({ ...form, reservation_id: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-silk-gold/20">
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
