import apiClient from './client'
import type { RoRoVehicle } from '@/types'

export const roRoApi = {
  list: (params?: { port?: string; status?: string }) =>
    apiClient.get<RoRoVehicle[]>('/ro-ro/', { params }).then((r) => r.data),
  entry: (data: { plate_number: string; driver_name: string; driver_phone?: string; vehicle_type?: string; port?: string; cargo_id?: number }) =>
    apiClient.post('/ro-ro/entry', data).then((r) => r.data),
  updateStatus: (id: number, status: string) =>
    apiClient.post(`/ro-ro/${id}/status`, { status }).then((r) => r.data),
  exit: (id: number) =>
    apiClient.post(`/ro-ro/${id}/exit`).then((r) => r.data),
  kpis: (params?: { port?: string; days?: number }) =>
    apiClient.get('/ro-ro/kpis', { params }).then((r) => r.data),
  analytics: (port?: string) =>
    apiClient.get('/ro-ro/analytics', { params: { port } }).then((r) => r.data),
}
