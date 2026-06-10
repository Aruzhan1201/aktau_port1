import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shipApi } from '@/api/ships'
import type { ShipCreateRequest, ShipUpdateRequest, LocationUpdateRequest } from '@/types'

const SHIP_KEYS = {
  all: ['ships'] as const,
  list: (params?: Record<string, unknown>) => [...SHIP_KEYS.all, 'list', params] as const,
  detail: (id: number) => [...SHIP_KEYS.all, id] as const,
}

export function useShipList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: SHIP_KEYS.list(params),
    queryFn: () => shipApi.list(params).then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useShip(id: number) {
  return useQuery({
    queryKey: SHIP_KEYS.detail(id),
    queryFn: () => shipApi.get(id).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useCreateShip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ShipCreateRequest) => shipApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIP_KEYS.all }),
  })
}

export function useUpdateShip(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ShipUpdateRequest) => shipApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIP_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: SHIP_KEYS.all })
    },
  })
}

export function useDeleteShip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => shipApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIP_KEYS.all }),
  })
}

export function useUpdateShipLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LocationUpdateRequest) => shipApi.updateLocation(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maps', 'ships'] })
      qc.invalidateQueries({ queryKey: SHIP_KEYS.all })
    },
  })
}
