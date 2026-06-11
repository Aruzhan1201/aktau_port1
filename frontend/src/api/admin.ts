import apiClient from './client'
import type { User, PortConfig, TransitRoute } from '@/types'

export const adminApi = {
  // User management
  listUsers: (params?: { role?: string; search?: string }) =>
    apiClient.get<User[]>('/admin/users/', { params }).then((r) => r.data),
  getUser: (id: number) =>
    apiClient.get<User>(`/admin/users/${id}`).then((r) => r.data),
  createUser: (data: { name: string; email: string; password: string; role: string; phone?: string }) =>
    apiClient.post('/admin/users/', data).then((r) => r.data),
  updateUser: (id: number, data: Partial<User> & { password?: string }) =>
    apiClient.put(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: number) =>
    apiClient.delete(`/admin/users/${id}`).then((r) => r.data),

  // Port config
  getPortConfig: (portName: string) =>
    apiClient.get<PortConfig>(`/admin/ports/${portName}`).then((r) => r.data),
  updatePortConfig: (portName: string, data: Partial<PortConfig>) =>
    apiClient.put(`/admin/ports/${portName}`, data).then((r) => r.data),
  getPortBerths: (portName: string) =>
    apiClient.get(`/admin/ports/${portName}/berths`).then((r) => r.data),
  batchCreateBerths: (portName: string, berths: Array<{ name: string; capacity: number; latitude: number; longitude: number }>) =>
    apiClient.post(`/admin/ports/${portName}/berths/batch`, { berths }).then((r) => r.data),
  getTransitRoutes: (portName: string) =>
    apiClient.get<TransitRoute[]>(`/admin/ports/${portName}/routes`).then((r) => r.data),
}
