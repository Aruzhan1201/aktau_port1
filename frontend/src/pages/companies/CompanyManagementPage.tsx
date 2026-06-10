import { useState } from 'react'
import { useCompanies, useCreateCompany } from '@/hooks/useEntities'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { Plus, Building2, X } from 'lucide-react'
import type { Company } from '@/types'

export function CompanyManagementPage() {
  const { data, isLoading } = useCompanies()
  const create = useCreateCompany()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', tax_id: '', address: '', phone: '', email: '' })

  const columns = [
    { key: 'name', header: 'Name', render: (c: Company) => (
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span className="font-medium text-slate-800">{c.name}</span>
      </div>
    )},
    { key: 'tax_id', header: 'Tax ID', render: (c: Company) => <span className="text-slate-500">{c.tax_id || '—'}</span> },
    { key: 'phone', header: 'Phone', render: (c: Company) => <span className="text-slate-600">{c.phone || '—'}</span> },
    { key: 'email', header: 'Email', render: (c: Company) => <span className="text-slate-600">{c.email || '—'}</span> },
    { key: 'created', header: 'Created', render: (c: Company) => <span className="text-slate-500">{formatDate(c.created_at)}</span> },
  ]

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync(form)
    setShowForm(false)
    setForm({ name: '', tax_id: '', address: '', phone: '', email: '' })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Companies"
        description="Client company management"
        actions={
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'New Company'}
          </Button>
        }
      />
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-5 mb-4 max-w-md shadow-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">New Company</h3>
          </div>
          <div className="space-y-3">
            <Input id="name" label="Company Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input id="tax_id" label="Tax ID" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
            <Input id="address" label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input id="phone" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <Button type="submit" loading={create.isPending} size="sm">
              <Plus className="w-3.5 h-3.5" />
              Create
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}
      <DataTable
        columns={columns}
        data={data ?? []}
        keyExtractor={(c: Company) => c.id}
        loading={isLoading}
        emptyMessage="No companies found"
        emptyDescription="Add your first company to the system."
      />
    </div>
  )
}
