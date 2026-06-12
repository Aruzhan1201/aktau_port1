export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://aktau-port1.onrender.com'
let _wsUrl = import.meta.env.VITE_WS_BASE_URL || 'wss://aktau-port1.onrender.com'
_wsUrl = _wsUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
export const WS_BASE_URL = _wsUrl

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
  SENDER_DASHBOARD: '/sender',
  RECEIVER_DASHBOARD: '/receiver',
  RECEIVER_SCHEDULES: '/receiver/schedules',
  GOV_DASHBOARD: '/government',
  GOV_INCIDENTS: '/government/incidents',
  GOV_REPORTS: '/government/reports',
  SUPER_ADMIN_USERS: '/admin/users',
  SUPER_ADMIN_TARIFFS: '/admin/tariffs',
  SUPER_ADMIN_PORTS: '/admin/ports',

  WEATHER: '/weather',
  RO_RO: '/ro-ro',
  RO_RO_ANALYTICS: '/ro-ro/analytics',
  PARKING_ZONES: '/parking/zones',
  PARKING_SPOTS: '/parking/spots',
  DRIVER_DASHBOARD: '/driver',
  PARKING_SPOT_DETAIL: (id: number) => `/parking/spots/${id}`,
  DEALS: '/deals',
  DEAL_DETAIL: (id: number) => `/deals/${id}`,
  CLIENT_TRACKING: '/tracking',
  CLIENT_TRACKING_DETAIL: (id: number) => `/tracking/${id}`,
  GOVERNANCE_EXCEL: '/government/excel',
  GOVERNANCE_TRAFFIC: '/government/traffic',
  GOVERNANCE_DOCUMENTS: '/government/documents',
  CLIENT_DASHBOARD: '/client',
  CHAT: '/chat',
} as const
