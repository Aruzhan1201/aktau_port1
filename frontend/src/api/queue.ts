import apiClient from './client'
import type { PortQueueItem, Assignment, AssignmentCreateRequest, PaginatedResponse } from '@/types'

export const queueApi = {
  get: () =>
    apiClient.get<PaginatedResponse<PortQueueItem>>('/queue/'),
  processNext: () =>
    apiClient.post<Assignment>('/queue/process'),
}

export const assignmentApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Assignment>>('/assignments/', { params }),
  create: (data: AssignmentCreateRequest) =>
    apiClient.post<Assignment>('/assignments/', data),
}
