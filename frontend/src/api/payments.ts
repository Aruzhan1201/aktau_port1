import apiClient from './client'
import type { Payment, PaymentCreateRequest, RevenueResponse, PaginatedResponse } from '@/types'

export const paymentApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Payment>>('/payments/', { params }),
  create: (data: PaymentCreateRequest) =>
    apiClient.post<Payment>('/payments/', data),
  markPaid: (id: number) =>
    apiClient.post<Payment>(`/payments/${id}/pay`),
  revenue: () =>
    apiClient.get<RevenueResponse>('/payments/revenue'),
}
