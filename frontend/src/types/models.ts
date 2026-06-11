import type { UserRole, CargoStatus, ShipStatus, BerthStatus, ReservationStatus, QueueStatus, PaymentType, PaymentStatus, DocumentType, VerificationStatus, NotificationType, DealStatus, DealType } from './enums'

export interface User {
  id: number
  company_id?: number | null
  role: UserRole
  name: string
  phone?: string | null
  email: string
  is_active: boolean
  created_at: string
}

export interface Company {
  id: number
  name: string
  tax_id?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  created_at: string
}

export interface Cargo {
  id: number
  client_id: number
  company_id?: number | null
  ship_id?: number | null
  driver_id?: number | null
  cargo_type: string
  weight: number
  origin: string
  destination: string
  status: CargoStatus
  eta?: string | null
  priority_score: number
  is_flagged: boolean
  flag_reason?: string | null
  ai_generated: boolean
  ai_confidence?: number | null
  route_waypoints?: { lat: number; lng: number }[] | null
  created_at: string
  updated_at: string
}

export interface Ship {
  id: number
  name: string
  imo_number?: string | null
  captain_id?: number | null
  current_location?: { latitude: number; longitude: number } | null
  capacity: number
  status: ShipStatus
  created_at: string
}

export interface Berth {
  id: number
  name: string
  manager_id?: number | null
  status: BerthStatus
  capacity: number
  location_coords?: { lat: number; lng: number } | null
  created_at: string
}

export interface BerthReservation {
  id: number
  berth_id: number
  ship_id: number
  status: ReservationStatus
  arrival_time: string
  departure_time?: string | null
  created_at: string
}

export interface CargoDocument {
  id: number
  cargo_id: number
  document_type: DocumentType
  file_url: string
  verification_status: VerificationStatus
  flagged_reason?: string | null
  verified_by?: number | null
  uploaded_at: string
  verified_at?: string | null
}

export interface CargoStatusLog {
  id: number
  cargo_id: number
  from_status?: CargoStatus | null
  to_status: CargoStatus
  changed_by?: number | null
  notes?: string | null
  timestamp: string
}

export interface Assignment {
  id: number
  ship_id: number
  berth_id: number
  cargo_id?: number | null
  status: string
  arrival_time?: string | null
  departure_time?: string | null
  created_at: string
}

export interface PortQueueItem {
  id: number
  cargo_id: number
  ship_id?: number | null
  priority_score: number
  status: QueueStatus
  entered_at: string
  assigned_at?: string | null
  completed_at?: string | null
  cargo_type?: string | null
  weight?: number | null
  destination?: string | null
}

export interface Payment {
  id: number
  type: PaymentType
  amount: number
  currency: string
  cargo_id?: number | null
  reservation_id?: number | null
  paid_by?: number | null
  status: PaymentStatus
  created_at: string
  paid_at?: string | null
  bank_name?: string | null
  bank_account?: string | null
  payment_method?: string | null
  reference_number?: string | null
}

export interface ChatMessage {
  id: string
  dealId?: number
  fromUserId: number
  toUserId: number
  text: string
  timestamp: string
  status: 'sending' | 'sent' | 'delivered' | 'read'
}

export interface Deal {
  id: number
  type: DealType
  status: DealStatus
  client_id: number
  driver_id?: number | null
  captain_id?: number | null
  cargo_id?: number | null
  proposed_price?: number | null
  currency: string
  client_status: string
  driver_status: string
  captain_status: string
  client_approved: boolean
  driver_approved: boolean
  captain_approved: boolean
  phone_revealed_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface ParkingZone {
  id: number
  name: string
  port: string
  manager_id?: number | null
  status: 'active' | 'inactive' | 'full'
  capacity: number
  location_coords?: { latitude: number; longitude: number } | null
  created_at: string
}

export interface ParkingSpot {
  id: number
  zone_id: number
  spot_number: string
  status: 'free' | 'reserved' | 'occupied' | 'maintenance'
  driver_id?: number | null
  tariff_per_hour?: number | null
  time_in?: string | null
  time_out?: string | null
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: NotificationType
  related_entity_type?: string | null
  related_entity_id?: number | null
  is_read: boolean
  created_at: string
}

export interface WeatherRecord {
  id: number
  port: string
  wind_speed: number
  wind_direction?: string | null
  wave_height: number
  visibility: number
  water_temperature?: number | null
  storm_alert: boolean
  storm_alert_message?: string | null
  fetched_at: string
}

export interface IncidentReport {
  id: number
  port: string
  incident_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  reported_by: number
  status: 'open' | 'investigating' | 'resolved'
  resolved_at?: string | null
  resolution_notes?: string | null
  created_at: string
}

export interface RoRoVehicle {
  id: number
  plate_number: string
  driver_name: string
  driver_phone?: string | null
  vehicle_type: string
  cargo_id?: number | null
  port: string
  status: 'entered' | 'loading' | 'loaded' | 'exited'
  entry_time: string
  exit_time?: string | null
  created_at: string
}

export interface TariffPlan {
  id: number
  port: string
  name: string
  service_type: string
  price: number
  unit: string
  currency: string
  valid_from?: string | null
  valid_to?: string | null
  created_at: string
  updated_at: string
}

export interface PortConfig {
  id: number
  port_name: string
  display_name: string
  center_lat: number
  center_lng: number
  zoom_level: number
  config_json?: Record<string, unknown> | null
  operations_status: string
}

export interface TransitRoute {
  id: number
  name: string
  port: string
  waypoints: Array<{ lat: number; lng: number }>
  color_hex: string
  description?: string | null
  distance_km?: number | null
}

export interface PerformanceReport {
  id: number
  port: string
  report_type: string
  title: string
  generated_by: number
  created_at: string
  data?: Record<string, unknown> | null
}

export interface GovDashboard {
  throughput: {
    total_cargo_7d: number
    ro_ro_vehicles_7d: number
  }
  berth_occupancy: {
    total_berths: number
    occupied: number
    free: number
    utilization_pct: number
  }
  delays: {
    average_wait_hours: number
    queue_length: number
    delayed_cargoes: number
  }
  incidents: {
    total_7d: number
  }
}
