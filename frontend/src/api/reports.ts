import apiClient from './client'

export const reportsApi = {
  export: (port: string, reportType: string, format: string = 'csv', days: number = 30) =>
    apiClient.get('/reports/export', {
      params: { port, report_type: reportType, format, days },
      responseType: format === 'csv' ? 'blob' : 'json',
    }).then((r) => r.data),
  generate: (data: { port: string; report_type: string; title?: string; period_days?: number }) =>
    apiClient.post('/reports/generate', data).then((r) => r.data),
  saved: (params?: { port?: string; report_type?: string }) =>
    apiClient.get('/reports/saved', { params }).then((r) => r.data),
}
