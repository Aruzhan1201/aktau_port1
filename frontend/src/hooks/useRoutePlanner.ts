import { useMutation } from '@tanstack/react-query'
import { routePlannerApi } from '@/api/routePlanner'

export function useRoutePlanner() {
  return useMutation({
    mutationFn: (question: string) => routePlannerApi.ask({ question }),
  })
}
