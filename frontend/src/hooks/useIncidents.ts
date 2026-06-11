import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { incidentsApi } from '@/api/incidents'

export function useIncidents(params?: { port?: string; status?: string; severity?: string }) {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: () => incidentsApi.list(params),
    staleTime: 30_000,
  })
}

export function useIncident(id: number) {
  return useQuery({
    queryKey: ['incidents', id],
    queryFn: () => incidentsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { port: string; incident_type: string; severity: string; description: string }) =>
      incidentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  })
}

export function useUpdateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status?: string; severity?: string; resolution_notes?: string } }) =>
      incidentsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  })
}

export function useIncidentStats(port?: string) {
  return useQuery({
    queryKey: ['incidents', 'stats', port],
    queryFn: () => incidentsApi.stats(port),
    staleTime: 60_000,
  })
}
