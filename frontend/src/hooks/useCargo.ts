import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cargoApi } from '@/api/cargo'
import type { CargoCreateRequest, CargoUpdateRequest, CargoStatusUpdateRequest, AssignShipRequest, AIOrderInput, CargoStatus } from '@/types'

const CARGO_KEYS = {
  all: ['cargoes'] as const,
  list: (params?: Record<string, unknown>) => [...CARGO_KEYS.all, 'list', params] as const,
  detail: (id: number) => [...CARGO_KEYS.all, id] as const,
  documents: (id: number) => [...CARGO_KEYS.all, id, 'documents'] as const,
}

export function useCargoList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: CARGO_KEYS.list(params),
    queryFn: () => cargoApi.list(params).then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useCargo(id: number) {
  return useQuery({
    queryKey: CARGO_KEYS.detail(id),
    queryFn: () => cargoApi.get(id).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useCreateCargo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CargoCreateRequest) => cargoApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CARGO_KEYS.all }),
  })
}

export function useUpdateCargo(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CargoUpdateRequest) => cargoApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CARGO_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: CARGO_KEYS.all })
    },
  })
}

export function useDeleteCargo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cargoApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CARGO_KEYS.all }),
  })
}

export function useUpdateCargoStatus(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CargoStatusUpdateRequest) => cargoApi.updateStatus(id, data).then((r) => r.data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: CARGO_KEYS.detail(id) })
      const prev = qc.getQueryData(CARGO_KEYS.detail(id))
      qc.setQueryData(CARGO_KEYS.detail(id), (old: unknown) =>
        old ? { ...(old as object), status: data.status as CargoStatus } : old
      )
      return { prev }
    },
    onError: (_err, _data, context) => {
      if (context?.prev) qc.setQueryData(CARGO_KEYS.detail(id), context.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CARGO_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: CARGO_KEYS.all })
      qc.invalidateQueries({ queryKey: ['queue'] })
      qc.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    },
  })
}

export function useAssignShip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AssignShipRequest) => cargoApi.assignShip(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CARGO_KEYS.all })
      qc.invalidateQueries({ queryKey: ['ships'] })
      qc.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useAIOrder() {
  return useMutation({
    mutationFn: (data: AIOrderInput) => cargoApi.aiOrder(data).then((r) => r.data),
  })
}
