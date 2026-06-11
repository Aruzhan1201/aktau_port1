import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'

export function useSavedReports(params?: { port?: string; report_type?: string }) {
  return useQuery({
    queryKey: ['reports', 'saved', params],
    queryFn: () => reportsApi.saved(params),
    staleTime: 60_000,
  })
}

export function useGenerateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { port: string; report_type: string; title?: string; period_days?: number }) =>
      reportsApi.generate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}
