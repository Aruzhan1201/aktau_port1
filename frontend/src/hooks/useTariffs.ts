import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tariffsApi } from '@/api/tariffs'

export function useTariffs(params?: { port?: string; service_type?: string }) {
  return useQuery({
    queryKey: ['tariffs', params],
    queryFn: () => tariffsApi.list(params),
    staleTime: 60_000,
  })
}

export function useActiveTariffs(port?: string) {
  return useQuery({
    queryKey: ['tariffs', 'active', port],
    queryFn: () => tariffsApi.active(port),
    staleTime: 60_000,
  })
}

export function useCreateTariff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof tariffsApi.create>[0]) => tariffsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tariffs'] }),
  })
}

export function useUpdateTariff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Parameters<typeof tariffsApi.update>[1]> }) =>
      tariffsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tariffs'] }),
  })
}

export function useDeleteTariff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => tariffsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tariffs'] }),
  })
}
