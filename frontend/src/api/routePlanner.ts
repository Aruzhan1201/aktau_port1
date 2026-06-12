import apiClient from './client'

export interface RouteQuestion {
  question: string
}

export interface RouteAnswer {
  answer: string
}

export const routePlannerApi = {
  ask: (data: RouteQuestion) =>
    apiClient.post<RouteAnswer>('/route-planner/ask', data).then((r) => r.data),
}
