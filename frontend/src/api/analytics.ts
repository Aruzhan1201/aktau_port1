import apiClient from './client'
import type { DashboardResponse, WaitingTimeReport, ShipUtilizationReport, RevenueResponse } from '@/types'

export const analyticsApi = {
  dashboard: () =>
    apiClient.get<DashboardResponse>('/analytics/dashboard'),
  revenue: () =>
    apiClient.get<RevenueResponse>('/analytics/revenue'),
  waitingTimes: () =>
    apiClient.get<WaitingTimeReport>('/analytics/waiting-times'),
  shipUtilization: () =>
    apiClient.get<ShipUtilizationReport>('/analytics/ship-utilization'),
}
