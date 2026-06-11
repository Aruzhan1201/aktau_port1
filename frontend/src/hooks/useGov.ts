import { useQuery } from '@tanstack/react-query'
import { govApi } from '@/api/gov'

export function useGovDashboard(port?: string) {
  return useQuery({
    queryKey: ['gov', 'dashboard', port],
    queryFn: () => govApi.dashboard(port),
    staleTime: 30_000,
  })
}

export function useGovThroughput(port?: string, days: number = 30) {
  return useQuery({
    queryKey: ['gov', 'throughput', port, days],
    queryFn: () => govApi.throughput(port, days),
    staleTime: 60_000,
  })
}

export function useGovDelays(days: number = 30) {
  return useQuery({
    queryKey: ['gov', 'delays', days],
    queryFn: () => govApi.delays(days),
    staleTime: 60_000,
  })
}
