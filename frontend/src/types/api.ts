import type { CargoStatus, PaymentType } from './enums'

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: number
  role: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone?: string
  role?: string
  company_id?: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CargoCreateRequest {
  cargo_type: string
  weight: number
  origin: string
  destination: string
  eta?: string
}

export interface CargoUpdateRequest {
  cargo_type?: string
  weight?: number
  origin?: string
  destination?: string
  eta?: string
}

export interface CargoStatusUpdateRequest {
  status: CargoStatus
  notes?: string
}

export interface AssignShipRequest {
  cargo_id: number
  ship_id: number
}

export interface AIOrderInput {
  text: string
}

export interface AIOrderOutput {
  cargo_type?: string
  weight?: number
  origin?: string
  destination?: string
  deadline?: string
  confidence: number
  missing_fields: string[]
  requires_review: boolean
}

export interface ShipCreateRequest {
  name: string
  imo_number?: string
  captain_id?: number
  capacity: number
}

export interface ShipUpdateRequest {
  name?: string
  imo_number?: string
  captain_id?: number
  capacity?: number
  status?: string
}

export interface LocationUpdateRequest {
  ship_id: number
  latitude: number
  longitude: number
}

export interface BerthCreateRequest {
  name: string
  capacity: number
  manager_id?: number
  latitude?: number
  longitude?: number
}

export interface BerthUpdateRequest {
  name?: string
  capacity?: number
  manager_id?: number
  status?: string
  latitude?: number
  longitude?: number
}

export interface BerthReserveRequest {
  berth_id: number
  ship_id: number
  arrival_time: string
  departure_time?: string
}

export interface AssignmentCreateRequest {
  ship_id: number
  berth_id: number
  cargo_id?: number
  arrival_time?: string
  departure_time?: string
}

export interface PaymentCreateRequest {
  type: PaymentType
  amount: number
  currency?: string
  cargo_id?: number
  reservation_id?: number
  paid_by?: number
}

export interface CompanyCreateRequest {
  name: string
  tax_id?: string
  address?: string
  phone?: string
  email?: string
}

export interface CompanyUpdateRequest {
  name?: string
  tax_id?: string
  address?: string
  phone?: string
  email?: string
}

export interface CargoDocumentVerifyRequest {
  verification_status: 'verified' | 'flagged'
  flagged_reason?: string
}

export interface PaginatedResponse<T> {
  total: number
  items: T[]
}

export interface RevenueResponse {
  total_income: number
  cargo_fees: number
  berth_fees: number
  penalties: number
  total_pending: number
  total_paid: number
}

export interface DashboardResponse {
  total_cargoes: number
  total_income: number
  income_by_type: Record<string, number>
  occupied_berths: number
  free_berths: number
  berth_utilization_pct: number
  average_waiting_time_hours: number
  ship_utilization_pct: number
  cargoes_by_status: Record<string, number>
}

export interface WaitingTimeReport {
  average_hours: number
  max_hours: number
  min_hours: number
  by_priority?: Record<string, number>
}

export interface ShipUtilizationReport {
  overall_pct: number
  by_ship: Record<string, number>[]
}

export interface ShipMapResponse {
  ship_id: number
  name: string
  latitude: number
  longitude: number
  status: string
  capacity: number
}

export interface BerthMapResponse {
  berth_id: number
  name: string
  latitude: number
  longitude: number
  status: string
  capacity: number
  current_ship_name?: string
}

export interface CaptainBookingRequest {
  berthId: number
  shipId: number
  arrivalTime: string
  departureTime?: string
  tariffPlan: 'standard' | 'premium' | 'economy'
}

export interface TariffPlan {
  id: string
  name: string
  description: string
  pricePerHour: number
  features: string[]
}

export interface RouteResponse {
  cargo_id: number
  origin: string
  destination: string
  origin_coords?: { lat: number; lng: number }
  destination_coords?: { lat: number; lng: number }
  ship_current_coords?: { lat: number; lng: number }
  waypoints: { lat: number; lng: number; order: number }[]
  status: string
}
