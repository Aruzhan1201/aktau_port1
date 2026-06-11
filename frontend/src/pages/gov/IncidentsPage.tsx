import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { useIncidents, useIncidentStats, useCreateIncident, useUpdateIncident } from '@/hooks/useIncidents'
import { useWsStore } from '@/store/wsStore'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Plus, X } from 'lucide-react'

const severityColors: Record<string, string> = { low: 'bg-slate-100 text-slate-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' }
const statusColors: Record<string, string> = { open: 'bg-red-100 text-red-700', investigating: 'bg-blue-100 text-blue-700', resolved: 'bg-green-100 text-green-700' }

export function IncidentsPage() {
  const [port, setPort] = useState<string>('')
  const subscribeChannel = useWsStore((s) => s.subscribeChannel)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ port: 'aktau', incident_type: '', severity: 'medium', description: '' })
  const { data: incidents, isLoading } = useIncidents(port ? { port } : undefined)

  useEffect(() => {
    subscribeChannel('incidents', port || undefined)
    return () => { useWsStore.getState().unsubscribeChannel('incidents') }
  }, [subscribeChannel, port])
  const { data: stats } = useIncidentStats(port || undefined)
  const createIncident = useCreateIncident()
  const updateIncident = useUpdateIncident()

  const handleCreate = () => {
    createIncident.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ port: 'aktau', incident_type: '', severity: 'medium', description: '' }) } })
  }

  const handleResolve = (id: number) => {
    updateIncident.mutate({ id, data: { status: 'resolved', resolution_notes: 'Resolved by operator' } })
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Incident Monitoring" description="Track and manage port incidents">
        <div className="flex gap-2">
          <select value={port} onChange={(e) => setPort(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
            <option value="">All Ports</option>
            <option value="aktau">Aktau</option>
            <option value="kuryk">Kuryk</option>
          </select>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Report
          </button>
        </div>
      </PageHeader>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.by_status?.open || 0}</p>
            <p className="text-xs text-slate-500">Open</p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.by_severity?.critical || 0}</p>
            <p className="text-xs text-slate-500">Critical</p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.resolution_rate_pct}%</p>
            <p className="text-xs text-slate-500">Resolved</p>
          </div>
        </div>
      )}

      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="space-y-3">
          {incidents?.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No incidents reported</p></div>
          ) : incidents?.map((inc) => (
            <div key={inc.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{inc.incident_type}</h3>
                    <Badge className={severityColors[inc.severity]}>{inc.severity}</Badge>
                    <Badge className={statusColors[inc.status]}>{inc.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{inc.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>Port: {inc.port}</span>
                    <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                    {inc.resolved_at && <span>Resolved: {new Date(inc.resolved_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                {inc.status !== 'resolved' && (
                  <button onClick={() => handleResolve(inc.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors">
                    <CheckCircle className="w-3 h-3" /> Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Report Incident</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <select value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="aktau">Aktau</option><option value="kuryk">Kuryk</option>
              </select>
              <input placeholder="Incident type" value={form.incident_type} onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={handleCreate} disabled={!form.incident_type || !form.description}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
