import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { useRoRoVehicles, useRoRoEntry, useRoRoExit, useRoRoUpdateStatus } from '@/hooks/useRoRo'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Plus, X, LogOut, Truck } from 'lucide-react'

const statusColors: Record<string, string> = {
  entered: 'bg-blue-100 text-blue-700', loading: 'bg-amber-100 text-amber-700',
  loaded: 'bg-purple-100 text-purple-700', exited: 'bg-green-100 text-green-700',
}

export function RoRoPage() {
  const [port, setPort] = useState('aktau')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plate_number: '', driver_name: '', driver_phone: '', vehicle_type: 'car' })
  const { data: vehicles, isLoading } = useRoRoVehicles({ port })
  const entry = useRoRoEntry()
  const exit = useRoRoExit()
  const updateStatus = useRoRoUpdateStatus()

  const handleEntry = () => {
    entry.mutate({ ...form, port }, { onSuccess: () => { setShowForm(false); setForm({ plate_number: '', driver_name: '', driver_phone: '', vehicle_type: 'car' }) } })
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Ro-Ro Vehicle Registration" description="Track vehicle entries and exits">
        <div className="flex gap-2">
          <select value={port} onChange={(e) => setPort(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
            <option value="aktau">Aktau</option><option value="kuryk">Kuryk</option>
          </select>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Entry
          </button>
        </div>
      </PageHeader>

      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="text-left p-3 font-medium text-slate-600">Plate</th><th className="text-left p-3 font-medium text-slate-600">Driver</th><th className="text-left p-3 font-medium text-slate-600">Type</th><th className="text-left p-3 font-medium text-slate-600">Status</th><th className="text-left p-3 font-medium text-slate-600">Entry</th><th className="p-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles?.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400"><Truck className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No vehicles registered</p></td></tr>
              ) : vehicles?.map((v: any) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{v.plate_number}</td>
                  <td className="p-3"><div><p className="text-slate-800">{v.driver_name}</p>{v.driver_phone && <p className="text-xs text-slate-400">{v.driver_phone}</p>}</div></td>
                  <td className="p-3 text-slate-600">{v.vehicle_type}</td>
                  <td className="p-3"><Badge className={statusColors[v.status]}>{v.status}</Badge></td>
                  <td className="p-3 text-xs text-slate-500">{new Date(v.entry_time).toLocaleString()}</td>
                  <td className="p-3">
                    {v.status === 'entered' && (
                      <div className="flex gap-1">
                        <button onClick={() => updateStatus.mutate({ id: v.id, status: 'loading' })}
                          className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200">Load</button>
                        <button onClick={() => exit.mutate(v.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                          <LogOut className="w-3 h-3" /> Exit
                        </button>
                      </div>
                    )}
                    {v.status === 'loading' && (
                      <button onClick={() => updateStatus.mutate({ id: v.id, status: 'loaded' })}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">Mark Loaded</button>
                    )}
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
              <h3 className="font-semibold text-lg">Register Entry</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Plate Number" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Driver Name" value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Driver Phone" value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="car">Car</option><option value="truck">Truck</option><option value="bus">Bus</option><option value="trailer">Trailer</option><option value="other">Other</option>
              </select>
              <button onClick={handleEntry} disabled={!form.plate_number || !form.driver_name}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                Register Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
