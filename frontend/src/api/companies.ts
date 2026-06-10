import apiClient from './client'
import type { Company, CompanyCreateRequest, CompanyUpdateRequest } from '@/types'

export const companyApi = {
  list: () =>
    apiClient.get<Company[]>('/company/'),
  get: (id: number) =>
    apiClient.get<Company>(`/company/${id}`),
  create: (data: CompanyCreateRequest) =>
    apiClient.post<Company>('/company/create', data),
  update: (id: number, data: CompanyUpdateRequest) =>
    apiClient.put<Company>(`/company/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/company/${id}`),
}
