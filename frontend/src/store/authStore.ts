import { create } from 'zustand'
import type { User, LoginRequest, RegisterRequest } from '@/types'
import { authApi } from '@/api/auth'

const TOKEN_KEY = 'aktau_port_token'

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function saveToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    /* localStorage unavailable */
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: loadToken(),
  isAuthenticated: false,
  isAuthLoading: true,

  login: async (data: LoginRequest) => {
    const res = await authApi.login(data)
    const token = res.data.access_token
    saveToken(token)
    set({ token, isAuthenticated: true })
    await get().checkAuth()
  },

  register: async (data: RegisterRequest) => {
    await authApi.register(data)
    saveToken(null)
    set({ token: null, user: null, isAuthenticated: false })
  },

  logout: () => {
    saveToken(null)
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const { token } = get()
    if (!token) {
      set({ user: null, isAuthenticated: false, isAuthLoading: false })
      return
    }
    try {
      const res = await authApi.me()
      set({ user: res.data, isAuthenticated: true, isAuthLoading: false })
    } catch {
      saveToken(null)
      set({ user: null, token: null, isAuthenticated: false, isAuthLoading: false })
    }
  },
}))
