import apiClient from './client'
import type { Cargo, CargoCreateRequest, CargoUpdateRequest, CargoStatusUpdateRequest, AssignShipRequest, PaginatedResponse, AIOrderInput, AIOrderOutput } from '@/types'

export const cargoApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Cargo>>('/cargo/', { params }),
  get: (id: number) =>
    apiClient.get<Cargo>(`/cargo/${id}`),
  create: (data: CargoCreateRequest) =>
    apiClient.post<Cargo>('/cargo/create', data),
  update: (id: number, data: CargoUpdateRequest) =>
    apiClient.put<Cargo>(`/cargo/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/cargo/${id}`),
  updateStatus: (id: number, data: CargoStatusUpdateRequest) =>
    apiClient.patch<Cargo>(`/cargo/${id}/status`, data),
  assignShip: (data: AssignShipRequest) =>
    apiClient.post<Cargo>('/cargo/assign-ship', data),
  aiOrder: (data: AIOrderInput) =>
    apiClient.post<AIOrderOutput>('/ai-order/', data),
}
