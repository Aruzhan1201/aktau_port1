export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'

export const PASSWORD_MIN_LENGTH = 8
export const MAX_UPLOAD_SIZE_MB = 10
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
export const ALLOWED_FILE_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
export const DEFAULT_PAGE_SIZE = 20

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CARGO: '/cargo',
  CARGO_NEW: '/cargo/new',
  CARGO_AI_ORDER: '/cargo/ai-order',
  CARGO_DETAIL: (id: number) => `/cargo/${id}`,
  SHIPS: '/ships',
  SHIP_NEW: '/ships/new',
  SHIP_DETAIL: (id: number) => `/ships/${id}`,
  BERTHS: '/berths',
  BERTH_DETAIL: (id: number) => `/berths/${id}`,
  BERTH_RESERVE: (id: number) => `/berths/${id}/reserve`,
  QUEUE: '/queue',
  ASSIGNMENTS: '/assignments',
  COMPANIES: '/companies',
  PAYMENTS: '/payments',
  REVENUE: '/payments/revenue',
  ANALYTICS: '/analytics',
  MAP: '/map',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  CAPTAIN_DASHBOARD: '/captain',
  CAPTAIN_ORDERS: '/captain/orders',
  CAPTAIN_PARKING: '/captain/parking',
  CAPTAIN_CHAT: '/captain/chat',
  CAPTAIN_DEALS: '/captain/deals',
} as const
