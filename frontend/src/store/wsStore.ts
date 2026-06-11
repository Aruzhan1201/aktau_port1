import { create } from 'zustand'
import { WS_BASE_URL } from '@/lib/constants'
import { useAuthStore } from './authStore'

interface QueuedMessage {
  id: string
  message: object
  timestamp: number
  retries: number
}

interface PendingAck {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  timer: ReturnType<typeof setTimeout>
}

interface WsSubscriptions {
  ships: Set<number>
  cargoes: Set<number>
  incidents: string | false
  weather: string | false
  berths: string | false
}

interface WsState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  socket: WebSocket | null
  subscriptions: WsSubscriptions
  messageQueue: QueuedMessage[]
  reconnectAttempt: number
  maxReconnectDelay: number
  pendingAcks: Map<string, PendingAck>

  connect: () => void
  disconnect: () => void
  subscribe: (type: 'ship' | 'cargo', id: number) => void
  unsubscribe: (type: 'ship' | 'cargo', id: number) => void
  subscribeChannel: (channel: 'incidents' | 'weather' | 'berths', port?: string) => void
  unsubscribeChannel: (channel: 'incidents' | 'weather' | 'berths') => void
  send: (message: object) => Promise<unknown>
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useWsStore = create<WsState>((set, get) => ({
  status: 'disconnected',
  socket: null,
      subscriptions: { ships: new Set(), cargoes: new Set(), incidents: false, weather: false, berths: false } as WsSubscriptions,
  messageQueue: [],
  reconnectAttempt: 0,
  maxReconnectDelay: 30000,
  pendingAcks: new Map(),

  connect: () => {
    const state = get()
    if (state.socket?.readyState === WebSocket.OPEN) return

    set({ status: 'connecting' })
    const token = useAuthStore.getState().token
    const ws = new WebSocket(`${WS_BASE_URL}/ws${token ? `?token=${token}` : ''}`)

    ws.onopen = () => {
      set({ status: 'connected', reconnectAttempt: 0 })
      const { subscriptions, messageQueue } = get()

      subscriptions.ships.forEach((id) => {
        ws.send(JSON.stringify({ type: 'subscribe_ship', ship_id: id }))
      })
      subscriptions.cargoes.forEach((id) => {
        ws.send(JSON.stringify({ type: 'subscribe_cargo', cargo_id: id }))
      })
      if (subscriptions.incidents !== false) {
        ws.send(JSON.stringify({ type: 'subscribe_incidents', port: subscriptions.incidents }))
      }
      if (subscriptions.weather !== false) {
        ws.send(JSON.stringify({ type: 'subscribe_weather', port: subscriptions.weather }))
      }
      if (subscriptions.berths !== false) {
        ws.send(JSON.stringify({ type: 'subscribe_berths', port: subscriptions.berths }))
      }

      messageQueue.forEach((qm) => {
        ws.send(JSON.stringify(qm.message))
      })
      set({ messageQueue: [] })
    }

    ws.onclose = () => {
      set({ status: 'reconnecting' })
      const { reconnectAttempt, maxReconnectDelay } = get()
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), maxReconnectDelay)
      setTimeout(() => {
        set((s) => ({ reconnectAttempt: s.reconnectAttempt + 1 }))
        get().connect()
      }, delay)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'ack') {
          const pending = get().pendingAcks.get(data.id)
          if (pending) {
            clearTimeout(pending.timer)
            pending.resolve(data)
            get().pendingAcks.delete(data.id)
          }
          return
        }
        window.dispatchEvent(new CustomEvent('ws-message', { detail: data }))
      } catch { /* ignore */ }
    }

    ws.onerror = () => {
      ws.close()
    }

    set({ socket: ws })
  },

  disconnect: () => {
    const { socket, pendingAcks } = get()
    if (socket) {
      socket.close()
    }
    pendingAcks.forEach((p) => clearTimeout(p.timer))
    set({
      socket: null,
      status: 'disconnected',
      pendingAcks: new Map(),
  subscriptions: { ships: new Set(), cargoes: new Set(), incidents: false, weather: false, berths: false } as WsSubscriptions,
      messageQueue: [],
      reconnectAttempt: 0,
    })
  },

  subscribe: (type, id) => {
    const { socket, subscriptions } = get()
    if (type === 'ship') {
      subscriptions.ships.add(id)
    } else {
      subscriptions.cargoes.add(id)
    }
    if (socket?.readyState === WebSocket.OPEN) {
      const msg = type === 'ship'
        ? { type: 'subscribe_ship', ship_id: id }
        : { type: 'subscribe_cargo', cargo_id: id }
      socket.send(JSON.stringify(msg))
    }
  },

  unsubscribe: (type, id) => {
    const { subscriptions } = get()
    if (type === 'ship') {
      subscriptions.ships.delete(id)
    } else {
      subscriptions.cargoes.delete(id)
    }
  },

  subscribeChannel: (channel, port = 'aktau') => {
    const { socket, subscriptions } = get()
    ;(subscriptions as any)[channel] = port
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: `subscribe_${channel}`, port }))
    }
  },

  unsubscribeChannel: (channel) => {
    const { subscriptions } = get()
    ;(subscriptions as any)[channel] = false
  },



  send: (message) => {
    return new Promise((resolve, reject) => {
      const id = generateId()
      const msg = { ...message, id }
      const { socket, status, pendingAcks } = get()

      if (status === 'connected' && socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg))
      } else {
        set((s) => ({
          messageQueue: [...s.messageQueue, { id, message: msg, timestamp: Date.now(), retries: 0 }],
        }))
      }

      const timer = setTimeout(() => {
        get().pendingAcks.delete(id)
        reject(new Error('ACK timeout'))
      }, 5000)

      pendingAcks.set(id, { resolve, reject, timer })
    })
  },
}))
