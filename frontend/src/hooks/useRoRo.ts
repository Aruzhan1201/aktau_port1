import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roRoApi } from '@/api/roRo'

export function useRoRoVehicles(params?: { port?: string; status?: string }) {
  return useQuery({
    queryKey: ['ro-ro', params],
    queryFn: () => roRoApi.list(params),
    staleTime: 15_000,
  })
}

export function useRoRoEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { plate_number: string; driver_name: string; driver_phone?: string; vehicle_type?: string; port?: string; cargo_id?: number }) =>
      roRoApi.entry(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ro-ro'] }),
  })
}

export function useRoRoExit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => roRoApi.exit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ro-ro'] }),
  })
}

export function useRoRoUpdateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      roRoApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ro-ro'] }),
  })
}

export function useRoRoKpis(params?: { port?: string; days?: number }) {
  return useQuery({
    queryKey: ['ro-ro', 'kpis', params],
    queryFn: () => roRoApi.kpis(params),
    staleTime: 60_000,
  })
}

export function useRoRoAnalytics(port?: string) {
  return useQuery({
    queryKey: ['ro-ro', 'analytics', port],
    queryFn: () => roRoApi.analytics(port),
    staleTime: 60_000,
  })
}
