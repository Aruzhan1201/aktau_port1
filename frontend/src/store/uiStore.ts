import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  offline: boolean
  toggleSidebar: () => void
  setOffline: (val: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  offline: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setOffline: (val) => set({ offline: val }),
}))
