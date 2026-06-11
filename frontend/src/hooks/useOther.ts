import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentApi, notificationApi, mapApi } from '@/api/other'
import type { CargoDocumentVerifyRequest } from '@/types'

export function useDocuments(cargoId: number) {
  return useQuery({
    queryKey: ['cargoes', cargoId, 'documents'],
    queryFn: () => documentApi.list(cargoId).then((r) => r.data),
    enabled: !!cargoId,
  })
}

export function useUploadDocument(cargoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ formData, onProgress }: { formData: FormData; onProgress?: (pct: number) => void }) =>
      documentApi.upload(cargoId, formData, onProgress).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cargoes', cargoId, 'documents'] }),
  })
}

export function useVerifyDocument(cargoId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: number; data: CargoDocumentVerifyRequest }) =>
      documentApi.verify(cargoId, documentId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cargoes', cargoId, 'documents'] })
      qc.invalidateQueries({ queryKey: ['cargoes', cargoId] })
    },
  })
}

export function useNotifications(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationApi.list(params).then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMapShips() {
  return useQuery({
    queryKey: ['maps', 'ships'],
    queryFn: () => mapApi.ships().then((r) => r.data),
    staleTime: 10_000,
  })
}

export function useMapBerths() {
  return useQuery({
    queryKey: ['maps', 'berths'],
    queryFn: () => mapApi.berths().then((r) => r.data),
    staleTime: 10_000,
  })
}

export function useMapRoute(cargoId: number) {
  return useQuery({
    queryKey: ['maps', 'routes', cargoId],
    queryFn: () => mapApi.route(cargoId).then((r) => r.data),
    enabled: !!cargoId,
  })
}

export function usePortMapBerths(port: string) {
  return useQuery({
    queryKey: ['maps', port, 'berths'],
    queryFn: () => mapApi.portBerths(port).then((r) => r.data),
    staleTime: 10_000,
    enabled: !!port,
  })
}

export function usePortMapRoutes(port: string) {
  return useQuery({
    queryKey: ['maps', port, 'routes'],
    queryFn: () => mapApi.portRoutes(port).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!port,
  })
}

export function useMapPortConfig(port: string) {
  return useQuery({
    queryKey: ['maps', port, 'config'],
    queryFn: () => mapApi.portConfig(port).then((r) => r.data),
    staleTime: 300_000,
    enabled: !!port,
  })
}

export function useWeather(port: string) {
  return useQuery({
    queryKey: ['weather', port],
    queryFn: () => weatherApi.getCurrent(port),
    staleTime: 300_000,
    enabled: !!port,
  })
}

export function useWeatherForecast(port: string) {
  return useQuery({
    queryKey: ['weather', port, 'forecast'],
    queryFn: () => weatherApi.getForecast(port),
    staleTime: 600_000,
    enabled: !!port,
  })
}

export function useWeatherAlerts() {
  return useQuery({
    queryKey: ['weather', 'alerts'],
    queryFn: () => weatherApi.getAlerts(),
    staleTime: 60_000,
  })
}

import { weatherApi } from '@/api/weather'
