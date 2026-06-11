import { useState } from 'react'
import { api } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function GovExcelReportPage() {
  const [days, setDays] = useState(30)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)

  const downloadExcel = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {}
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (!dateFrom && !dateTo) params.days = days

      const response = await api.get('/governance/reports/excel', {
        params,
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const filename = `aktau_port_report_${dateFrom || `last_${days}d`}_${dateTo || 'now'}.xlsx`
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download Excel report:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Excel Reports"
        description="Export system data as Excel for governance oversight"
      />

      <div className="max-w-lg bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Or use last N days</label>
          <Input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            disabled={!!dateFrom || !!dateTo}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date From</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date To</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        <Button onClick={downloadExcel} disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Download Excel Report'}
        </Button>
      </div>
    </div>
  )
}
