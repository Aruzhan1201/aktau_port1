import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useUiStore } from '@/store/uiStore'
import { AlertTriangle, X, Send } from 'lucide-react'

const incidentTypes = [
  { value: 'accident', label: 'Accident' },
  { value: 'delay', label: 'Delay' },
  { value: 'equipment_failure', label: 'Equipment Failure' },
  { value: 'safety_hazard', label: 'Safety Hazard' },
  { value: 'theft', label: 'Theft' },
  { value: 'other', label: 'Other' },
]

const severities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

interface ReportIncidentModalProps {
  open: boolean
  onClose: () => void
}

export function ReportIncidentModal({ open, onClose }: ReportIncidentModalProps) {
  const addNotification = useUiStore((s) => s.addNotification)
  const [form, setForm] = useState({
    incident_type: '',
    severity: '',
    description: '',
    port: 'aktau',
  })

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/incidents', data).then((r) => r.data),
    onSuccess: () => {
      addNotification('Incident Reported', 'Your report has been submitted to governance.')
      setForm({ incident_type: '', severity: '', description: '', port: 'aktau' })
      onClose()
    },
    onError: () => {
      addNotification('Error', 'Failed to submit report. Please try again.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.incident_type || !form.severity || !form.description.trim()) return
    mutation.mutate(form)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-modern-slate rounded-xl border border-silk-gold/30 shadow-2xl w-full max-w-lg mx-4 animate-slide-up">
        <div className="pattern-border-diamond">
          <div className="flex items-center justify-between p-5 border-b border-silk-gold/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-silk-gold-dark" />
              <h2 className="text-lg font-semibold text-kazakh-burgundy dark:text-silk-gold font-serif">
                Report Incident
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-silk-gold/20 transition-colors text-modern-slate"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-modern-slate dark:text-warm-sand uppercase tracking-wider mb-1.5 font-sans">
                Port
              </label>
              <select
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                className="w-full border border-silk-gold/40 rounded-lg px-3 py-2.5 text-sm bg-heritage-cream dark:bg-kazakh-burgundy-dark text-modern-slate dark:text-warm-sand focus:outline-none focus:ring-2 focus:ring-silk-gold focus:border-transparent transition-all"
              >
                <option value="aktau">Aktau Port</option>
                <option value="kuryk">Kuryk Port</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-modern-slate dark:text-warm-sand uppercase tracking-wider mb-1.5 font-sans">
                Incident Type
              </label>
              <select
                value={form.incident_type}
                onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
                className="w-full border border-silk-gold/40 rounded-lg px-3 py-2.5 text-sm bg-heritage-cream dark:bg-kazakh-burgundy-dark text-modern-slate dark:text-warm-sand focus:outline-none focus:ring-2 focus:ring-silk-gold focus:border-transparent transition-all"
                required
              >
                <option value="">Select type...</option>
                {incidentTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-modern-slate dark:text-warm-sand uppercase tracking-wider mb-1.5 font-sans">
                Severity
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full border border-silk-gold/40 rounded-lg px-3 py-2.5 text-sm bg-heritage-cream dark:bg-kazakh-burgundy-dark text-modern-slate dark:text-warm-sand focus:outline-none focus:ring-2 focus:ring-silk-gold focus:border-transparent transition-all"
                required
              >
                <option value="">Select severity...</option>
                {severities.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-modern-slate dark:text-warm-sand uppercase tracking-wider mb-1.5 font-sans">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-silk-gold/40 rounded-lg px-3 py-2.5 text-sm bg-heritage-cream dark:bg-kazakh-burgundy-dark text-modern-slate dark:text-warm-sand focus:outline-none focus:ring-2 focus:ring-silk-gold focus:border-transparent transition-all min-h-[100px] resize-y"
                placeholder="Describe the incident in detail..."
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-kazakh-burgundy hover:bg-kazakh-burgundy-light text-heritage-cream font-medium rounded-lg px-4 py-2.5 transition-all duration-200 disabled:opacity-50 text-sm"
              >
                <Send className="w-4 h-4" />
                {mutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-silk-gold/40 text-modern-slate dark:text-warm-sand hover:bg-silk-gold/10 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
