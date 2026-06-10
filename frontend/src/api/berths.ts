import apiClient from './client'
import type { Berth, BerthCreateRequest, BerthUpdateRequest, BerthReserveRequest, BerthReservation, PaginatedResponse } from '@/types'

export const berthApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Berth>>('/berth/', { params }),
  get: (id: number) =>
    apiClient.get<Berth>(`/berth/${id}`),
  create: (data: BerthCreateRequest) =>
    apiClient.post<Berth>('/berth/create', data),
  update: (id: number, data: BerthUpdateRequest) =>
    apiClient.put<Berth>(`/berth/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/berth/${id}`),
  reserve: (data: BerthReserveRequest) =>
    apiClient.post<BerthReservation>('/berth/reserve', data),
  getReservation: (id: number) =>
    apiClient.get<BerthReservation>(`/berth/reservation/${id}`),
  updateReservation: (id: number, data: Partial<BerthReservation>) =>
    apiClient.put<BerthReservation>(`/berth/reservation/${id}`, data),
  cancelReservation: (id: number) =>
    apiClient.delete(`/berth/reservation/${id}`),
  listReservations: (berthId: number) =>
    apiClient.get<BerthReservation[]>(`/berth/${berthId}/reservations`),
}
