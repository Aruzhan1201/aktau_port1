import apiClient from './client'
import type { IncidentReport } from '@/types'

export const incidentsApi = {
  list: (params?: { port?: string; status?: string; severity?: string }) =>
    apiClient.get<IncidentReport[]>('/incidents/', { params }).then((r) => r.data),
  get: (id: number) =>
    apiClient.get<IncidentReport>(`/incidents/${id}`).then((r) => r.data),
  create: (data: { port: string; incident_type: string; severity: string; description: string }) =>
    apiClient.post('/incidents/', data).then((r) => r.data),
  update: (id: number, data: { status?: string; severity?: string; resolution_notes?: string }) =>
    apiClient.patch(`/incidents/${id}`, data).then((r) => r.data),
  stats: (port?: string) =>
    apiClient.get('/incidents/stats', { params: { port } }).then((r) => r.data),
}
