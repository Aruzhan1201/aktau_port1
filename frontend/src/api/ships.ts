import apiClient from './client'
import type { Ship, ShipCreateRequest, ShipUpdateRequest, LocationUpdateRequest, PaginatedResponse } from '@/types'

export const shipApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Ship>>('/ship/', { params }),
  get: (id: number) =>
    apiClient.get<Ship>(`/ship/${id}`),
  create: (data: ShipCreateRequest) =>
    apiClient.post<Ship>('/ship/create', data),
  update: (id: number, data: ShipUpdateRequest) =>
    apiClient.put<Ship>(`/ship/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/ship/${id}`),
  updateLocation: (data: LocationUpdateRequest) =>
    apiClient.post<Ship>('/ship/update-location', data),
}
