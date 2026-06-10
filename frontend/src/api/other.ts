import apiClient from './client'
import type { Notification, CargoDocument, CargoDocumentVerifyRequest, ShipMapResponse, BerthMapResponse, RouteResponse } from '@/types'

export const notificationApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<{ total: number; unread: number; items: Notification[] }>('/notifications/', { params }),
  markRead: (id: number) =>
    apiClient.patch(`/notifications/${id}/read`),
}

export const documentApi = {
  list: (cargoId: number) =>
    apiClient.get<CargoDocument[]>(`/cargo/${cargoId}/documents/`),
  upload: (cargoId: number, formData: FormData, onProgress?: (pct: number) => void) =>
    apiClient.post<CargoDocument>(`/cargo/${cargoId}/documents/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    }),
  verify: (cargoId: number, documentId: number, data: CargoDocumentVerifyRequest) =>
    apiClient.patch<CargoDocument>(`/cargo/${cargoId}/documents/${documentId}/verify`, data),
}

export const mapApi = {
  ships: () =>
    apiClient.get<ShipMapResponse[]>('/maps/ships'),
  berths: () =>
    apiClient.get<BerthMapResponse[]>('/maps/berths'),
  route: (cargoId: number) =>
    apiClient.get<RouteResponse>(`/maps/routes/${cargoId}`),
}
