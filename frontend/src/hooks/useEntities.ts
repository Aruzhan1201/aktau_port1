import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queueApi, assignmentApi } from '@/api/queue'
import { paymentApi } from '@/api/payments'
import { analyticsApi } from '@/api/analytics'
import { companyApi } from '@/api/companies'
import type { AssignmentCreateRequest, PaymentCreateRequest, CompanyCreateRequest, CompanyUpdateRequest } from '@/types'

export function useQueue() {
  return useQuery({
    queryKey: ['queue'],
    queryFn: () => queueApi.get().then((r) => r.data),
    staleTime: 15_000,
  })
}

export function useProcessQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => queueApi.processNext().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue'] })
      qc.invalidateQueries({ queryKey: ['berths'] })
      qc.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useAssignments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => assignmentApi.list(params).then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useCreateAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AssignmentCreateRequest) => assignmentApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] })
      qc.invalidateQueries({ queryKey: ['queue'] })
      qc.invalidateQueries({ queryKey: ['ships'] })
      qc.invalidateQueries({ queryKey: ['berths'] })
    },
  })
}

export function usePayments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentApi.list(params).then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PaymentCreateRequest) => paymentApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payments', 'revenue'] })
      qc.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    },
  })
}

export function useMarkPaymentPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => paymentApi.markPaid(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payments', 'revenue'] })
    },
  })
}

export function useRevenue() {
  return useQuery({
    queryKey: ['payments', 'revenue'],
    queryFn: () => paymentApi.revenue().then((r) => r.data),
    staleTime: 120_000,
  })
}

export function useDashboard() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
    staleTime: 300_000,
  })
}

export function useAnalyticsRevenue() {
  return useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsApi.revenue().then((r) => r.data),
    staleTime: 300_000,
  })
}

export function useWaitingTimes() {
  return useQuery({
    queryKey: ['analytics', 'waiting-times'],
    queryFn: () => analyticsApi.waitingTimes().then((r) => r.data),
    staleTime: 300_000,
  })
}

export function useShipUtilization() {
  return useQuery({
    queryKey: ['analytics', 'ship-utilization'],
    queryFn: () => analyticsApi.shipUtilization().then((r) => r.data),
    staleTime: 300_000,
  })
}

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.list().then((r) => r.data),
    staleTime: 120_000,
  })
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => companyApi.get(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CompanyCreateRequest) => companyApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useUpdateCompany(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CompanyUpdateRequest) => companyApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies', id] })
      qc.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useDeleteCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => companyApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}
