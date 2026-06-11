import apiClient from './client'
import type { GovDashboard } from '@/types'

export const govApi = {
  dashboard: (port?: string) =>
    apiClient.get<GovDashboard>('/analytics/gov/dashboard', { params: { port } }).then((r) => r.data),
  throughput: (port?: string, days: number = 30) =>
    apiClient.get('/analytics/gov/throughput', { params: { port, days } }).then((r) => r.data),
  delays: (days: number = 30) =>
    apiClient.get('/analytics/gov/delays', { params: { days } }).then((r) => r.data),
}
