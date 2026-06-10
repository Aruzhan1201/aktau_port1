import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { berthApi } from '@/api/berths'
import type { BerthCreateRequest, BerthUpdateRequest, BerthReserveRequest } from '@/types'

const BERTH_KEYS = {
  all: ['berths'] as const,
  list: (params?: Record<string, unknown>) => [...BERTH_KEYS.all, 'list', params] as const,
  detail: (id: number) => [...BERTH_KEYS.all, id] as const,
  reservations: (berthId: number) => [...BERTH_KEYS.all, berthId, 'reservations'] as const,
}

export function useBerthList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: BERTH_KEYS.list(params),
    queryFn: () => berthApi.list(params).then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useBerth(id: number) {
  return useQuery({
    queryKey: BERTH_KEYS.detail(id),
    queryFn: () => berthApi.get(id).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useCreateBerth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BerthCreateRequest) => berthApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BERTH_KEYS.all }),
  })
}

export function useUpdateBerth(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BerthUpdateRequest) => berthApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BERTH_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: BERTH_KEYS.all })
    },
  })
}

export function useDeleteBerth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => berthApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BERTH_KEYS.all }),
  })
}

export function useReserveBerth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BerthReserveRequest) => berthApi.reserve(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BERTH_KEYS.all })
      qc.invalidateQueries({ queryKey: ['ships'] })
    },
  })
}

export function useBerthReservations(berthId: number) {
  return useQuery({
    queryKey: BERTH_KEYS.reservations(berthId),
    queryFn: () => berthApi.listReservations(berthId).then((r) => r.data),
    enabled: !!berthId,
  })
}

export function useUpdateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ arrival_time?: string; departure_time?: string; status?: string }> }) =>
      berthApi.updateReservation(id, data as Parameters<typeof berthApi.updateReservation>[1]).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BERTH_KEYS.all })
      qc.invalidateQueries({ queryKey: ['berths'] })
    },
  })
}

export function useCancelReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => berthApi.cancelReservation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BERTH_KEYS.all })
      qc.invalidateQueries({ queryKey: ['berths'] })
    },
  })
}
