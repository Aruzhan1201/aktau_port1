import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { useTariffs, useCreateTariff, useUpdateTariff, useDeleteTariff } from '@/hooks/useTariffs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Trash2, Edit3 } from 'lucide-react'

export function TariffManagementPage() {
  const [port, setPort] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ port: 'aktau', name: '', service_type: 'berth', price: 0, unit: 'per_hour', currency: 'USD' })
  const { data: tariffs, isLoading } = useTariffs(port ? { port } : undefined)
  const createTariff = useCreateTariff()
  const updateTariff = useUpdateTariff()
  const deleteTariff = useDeleteTariff()

  const handleSubmit = () => {
    if (editId) {
      updateTariff.mutate({ id: editId, data: form }, { onSuccess: () => { setShowForm(false); setEditId(null) } })
    } else {
      createTariff.mutate(form, { onSuccess: () => { setShowForm(false) } })
    }
  }

  const handleEdit = (t: any) => {
    setForm({ port: t.port, name: t.name, service_type: t.service_type, price: t.price, unit: t.unit, currency: t.currency })
    setEditId(t.id)
    setShowForm(true)
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Tariff Management" description="Configure port service pricing">
        <div className="flex gap-2">
          <select value={port} onChange={(e) => setPort(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
            <option value="">All Ports</option><option value="aktau">Aktau</option><option value="kuryk">Kuryk</option>
          </select>
          <button onClick={() => { setEditId(null); setForm({ port: 'aktau', name: '', service_type: 'berth', price: 0, unit: 'per_hour', currency: 'USD' }); setShowForm(true) }}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </PageHeader>

      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="text-left p-3 font-medium text-slate-600">Name</th><th className="text-left p-3 font-medium text-slate-600">Port</th><th className="text-left p-3 font-medium text-slate-600">Service</th><th className="text-left p-3 font-medium text-slate-600">Price</th><th className="text-left p-3 font-medium text-slate-600">Unit</th><th className="p-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tariffs?.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{t.name}</td>
                  <td className="p-3"><Badge className="bg-slate-100 text-slate-700">{t.port}</Badge></td>
                  <td className="p-3 text-slate-600">{t.service_type}</td>
                  <td className="p-3 font-medium">{t.price} {t.currency}</td>
                  <td className="p-3 text-slate-500">{t.unit}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(t)} className="text-blue-400 hover:text-blue-600"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete tariff?')) deleteTariff.mutate(t.id) }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Add'} Tariff</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="aktau">Aktau</option><option value="kuryk">Kuryk</option>
              </select>
              <select value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="berth">Berth</option><option value="cargo">Cargo</option><option value="roro">Ro-Ro</option><option value="storage">Storage</option>
              </select>
              <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="per_hour">Per Hour</option><option value="per_day">Per Day</option><option value="per_ton">Per Ton</option><option value="per_vehicle">Per Vehicle</option><option value="flat">Flat</option>
              </select>
              <button onClick={handleSubmit} disabled={!form.name || !form.price}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                {editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
