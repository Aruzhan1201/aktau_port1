import apiClient from './client'
import type { TariffPlan } from '@/types'

export const tariffsApi = {
  list: (params?: { port?: string; service_type?: string }) =>
    apiClient.get<TariffPlan[]>('/tariffs/', { params }).then((r) => r.data),
  active: (port?: string) =>
    apiClient.get<TariffPlan[]>('/tariffs/active', { params: { port } }).then((r) => r.data),
  calculate: (port: string, service_type: string, units?: number) =>
    apiClient.get('/tariffs/calculate', { params: { port, service_type, units } }).then((r) => r.data),
  create: (data: Partial<TariffPlan> & { port: string; name: string; service_type: string; price: number }) =>
    apiClient.post('/tariffs/', data).then((r) => r.data),
  update: (id: number, data: Partial<TariffPlan>) =>
    apiClient.put(`/tariffs/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    apiClient.delete(`/tariffs/${id}`).then((r) => r.data),
}
