import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { useSavedReports, useGenerateReport } from '@/hooks/useReports'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, FileText, Plus } from 'lucide-react'
import { reportsApi } from '@/api/reports'

export function ReportsPage() {
  const [port, setPort] = useState('aktau')
  const [reportType, setReportType] = useState('performance')
  const [days, setDays] = useState(30)
  const { data: saved, isLoading } = useSavedReports({ port, report_type: reportType })
  const generateReport = useGenerateReport()

  const handleGenerate = () => {
    generateReport.mutate({ port, report_type: reportType, title: `${reportType} ${port} ${days}d`, period_days: days })
  }

  const handleExport = async (type: string) => {
    try {
      const blob = await reportsApi.export(port, type, 'csv', days)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${type}_${port}.csv`; a.click()
      window.URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reports" description="Generate and export port performance reports" />

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Generate Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select value={port} onChange={(e) => setPort(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value="aktau">Aktau</option><option value="kuryk">Kuryk</option>
          </select>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value="performance">Performance</option>
            <option value="safety">Safety</option>
            <option value="throughput">Throughput</option>
            <option value="delays">Delays</option>
          </select>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
          </select>
          <button onClick={handleGenerate}
            className="flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Generate
          </button>
        </div>
        <div className="flex gap-2">
          {['performance', 'safety', 'throughput', 'delays'].map((t) => (
            <button key={t} onClick={() => handleExport(t)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">
              <Download className="w-3 h-3" /> {t} CSV
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Saved Reports</h3>
        {isLoading ? <Skeleton className="h-32" /> : !saved?.length ? (
          <p className="text-sm text-slate-500">No saved reports yet</p>
        ) : (
          <div className="space-y-2">
            {saved.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.report_type} · {r.port} · {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
