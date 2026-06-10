import { useAssignments, useCreateAssignment } from '@/hooks/useEntities'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'
import { Plus, Link2, X } from 'lucide-react'
import type { Assignment } from '@/types'

export function AssignmentsPage() {
  const { data, isLoading } = useAssignments()
  const create = useCreateAssignment()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ship_id: '', berth_id: '', cargo_id: '' })

  const columns = [
    { key: 'id', header: 'ID', render: (a: Assignment) => <span className="font-mono text-xs text-slate-400">#{a.id}</span> },
    { key: 'ship', header: 'Ship', render: (a: Assignment) => <span className="font-medium">#{a.ship_id}</span> },
    { key: 'berth', header: 'Berth', render: (a: Assignment) => <span className="font-medium">#{a.berth_id}</span> },
    { key: 'cargo', header: 'Cargo', render: (a: Assignment) => a.cargo_id ? <span className="font-medium">#{a.cargo_id}</span> : <span className="text-slate-400">—</span> },
    { key: 'status', header: 'Status', render: (a: Assignment) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        a.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
        a.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
        'bg-slate-50 text-slate-600'
      }`}>
        {a.status.replace('_', ' ')}
      </span>
    )},
    { key: 'created', header: 'Created', render: (a: Assignment) => <span className="text-slate-500">{formatDate(a.created_at)}</span> },
  ]

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync({
      ship_id: Number(form.ship_id),
      berth_id: Number(form.berth_id),
      cargo_id: form.cargo_id ? Number(form.cargo_id) : undefined,
    })
    setShowForm(false)
    setForm({ ship_id: '', berth_id: '', cargo_id: '' })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Assignments"
        description="Ship-berth-cargo assignments"
        actions={
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'New Assignment'}
          </Button>
        }
      />
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-5 mb-4 max-w-md shadow-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Create Assignment</h3>
          </div>
          <div className="space-y-3">
            <Input id="ship_id" label="Ship ID" type="number" value={form.ship_id} onChange={(e) => setForm({ ...form, ship_id: e.target.value })} required />
            <Input id="berth_id" label="Berth ID" type="number" value={form.berth_id} onChange={(e) => setForm({ ...form, berth_id: e.target.value })} required />
            <Input id="cargo_id" label="Cargo ID (optional)" type="number" value={form.cargo_id} onChange={(e) => setForm({ ...form, cargo_id: e.target.value })} />
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
        data={data?.items ?? []}
        keyExtractor={(a: Assignment) => a.id}
        loading={isLoading}
        emptyMessage="No assignments found"
        emptyDescription="Create an assignment to link ships, berths, and cargo."
      />
    </div>
  )
}
