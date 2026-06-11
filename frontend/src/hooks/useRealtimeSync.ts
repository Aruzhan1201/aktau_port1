import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/store/uiStore'

type WsMessage = Record<string, unknown>

function getQueryKeys(type: string): string[][] {
  switch (type) {
    case 'incident_created':
    case 'incident_updated':
      return [['incidents'], ['gov-dashboard']]
    case 'ro_ro_entry':
    case 'ro_ro_status':
      return [['ro-ro'], ['ro-ro-kpis'], ['ro-ro-analytics']]
    case 'weather_alert':
      return [['weather'], ['weather-alerts']]
    case 'location_updated':
      return [['ships']]
    case 'cargo_update':
    case 'cargo_status':
      return [['cargo']]
    case 'berth_status':
      return [['berths']]
    default:
      return []
  }
}

function getNotificationFromMessage(data: WsMessage): { title: string; message: string } | null {
  switch (data.type) {
    case 'incident_created': {
      const inc = data.incident as Record<string, unknown> | undefined
      return {
        title: 'New Incident Reported',
        message: `${inc?.severity ?? 'Unknown'} severity: ${inc?.incident_type ?? 'Unknown'} at ${inc?.port ?? 'the port'}`,
      }
    }
    case 'incident_updated': {
      const inc = data.incident as Record<string, unknown> | undefined
      return {
        title: 'Incident Updated',
        message: `Incident #${inc?.id ?? ''} status changed to ${inc?.status ?? 'unknown'}`,
      }
    }
    case 'ro_ro_entry': {
      const v = data.vehicle as Record<string, unknown> | undefined
      return {
        title: 'Ro-Ro Vehicle Entered',
        message: `${v?.plate_number ?? 'Unknown'} (${v?.vehicle_type ?? 'Unknown'}) entered ${v?.port ?? 'port'}`,
      }
    }
    case 'ro_ro_status': {
      const v = data.vehicle as Record<string, unknown> | undefined
      return {
        title: 'Ro-Ro Status Changed',
        message: `${v?.plate_number ?? 'Unknown'} is now ${v?.status ?? 'unknown'}`,
      }
    }
    case 'weather_alert':
      return {
        title: '⚠️ Weather Alert',
        message: `${data.message as string} at ${data.port as string}`,
      }
    default:
      return null
  }
}

export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const addNotification = useUiStore((s) => s.addNotification)
  const processedIds = useRef(new Set<string>())

  useEffect(() => {
    const handler = (event: Event) => {
      const data = (event as CustomEvent).detail as WsMessage
      const msgType = data.type as string

      const uid = `${msgType}_${JSON.stringify(data)}`
      if (processedIds.current.has(uid)) return
      processedIds.current.add(uid)
      setTimeout(() => processedIds.current.delete(uid), 2000)

      const keys = getQueryKeys(msgType)
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })

      const notif = getNotificationFromMessage(data)
      if (notif) {
        addNotification(notif.title, notif.message)
      }
    }

    window.addEventListener('ws-message', handler)
    return () => window.removeEventListener('ws-message', handler)
  }, [queryClient, addNotification])
}
