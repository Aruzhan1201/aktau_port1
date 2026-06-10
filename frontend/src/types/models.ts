import type { UserRole, CargoStatus, ShipStatus, BerthStatus, ReservationStatus, QueueStatus, PaymentType, PaymentStatus, DocumentType, VerificationStatus, NotificationType, DealStatus, DealType, ChatParticipant } from './enums'

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
  location_coords?: { latitude: number; longitude: number } | null
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
  title: string
  description?: string
  initiatorId: number
  targetId: number
  status: DealStatus
  cargoId?: number
  berthId?: number
  shipId?: number
  amount?: number
  currency?: string
  tariffName?: string
  tariffDescription?: string
  initiatorPhoneRevealed: boolean
  targetPhoneRevealed: boolean
  initiatorPhone?: string
  targetPhone?: string
  createdAt: string
  updatedAt: string
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
