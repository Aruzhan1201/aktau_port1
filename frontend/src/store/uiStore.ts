import { create } from 'zustand'

interface AppNotification {
  id: string
  title: string
  message: string
  timestamp: number
}

interface UiState {
  sidebarCollapsed: boolean
  offline: boolean
  notifications: AppNotification[]
  toggleSidebar: () => void
  setOffline: (val: boolean) => void
  addNotification: (title: string, message: string) => void
  dismissNotification: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  offline: false,
  notifications: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setOffline: (val) => set({ offline: val }),
  addNotification: (title, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => ({
      notifications: [...s.notifications, { id, title, message, timestamp: Date.now() }],
    }))
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
    }, 6000)
  },
  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}))
