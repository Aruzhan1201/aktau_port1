import apiClient from './client'
import type { WeatherRecord } from '@/types'

export const weatherApi = {
  getCurrent: (port: string) =>
    apiClient.get<WeatherRecord>(`/weather/${port}`).then((r) => r.data),
  getForecast: (port: string) =>
    apiClient.get<unknown[]>(`/weather/${port}/forecast`).then((r) => r.data),
  getAlerts: () =>
    apiClient.get<WeatherRecord[]>('/weather/alerts/all').then((r) => r.data),
}
