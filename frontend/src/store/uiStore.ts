import { create } from 'zustand'

interface AppNotification {
  id: string
  title: string
  message: string
  timestamp: number
}

interface UiState {
  sidebarCollapsed: boolean
  darkMode: boolean
  offline: boolean
  notifications: AppNotification[]
  toggleSidebar: () => void
  toggleDarkMode: () => void
  setOffline: (val: boolean) => void
  addNotification: (title: string, message: string) => void
  dismissNotification: (id: string) => void
}

function getInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch { return false }
}

function applyDarkMode(dark: boolean) {
  try { localStorage.setItem('darkMode', String(dark)) } catch { /* noop */ }
  document.documentElement.classList.toggle('dark', dark)
}

const initialDark = getInitialDarkMode()
applyDarkMode(initialDark)

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  darkMode: initialDark,
  offline: false,
  notifications: [],
  toggleSidebar: () => set((s) => {
    const next = !s.sidebarCollapsed
    try { localStorage.setItem('sidebarCollapsed', String(next)) } catch { /* noop */ }
    return { sidebarCollapsed: next }
  }),
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode
    applyDarkMode(next)
    return { darkMode: next }
  }),
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
