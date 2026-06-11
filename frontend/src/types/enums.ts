export type UserRole = 'client' | 'parking_manager' | 'driver' | 'captain' | 'port_manager' | 'governance' | 'admin' | 'super_admin'

export type CargoStatus = 'created' | 'approved' | 'assigned' | 'loading' | 'in_transit' | 'arrived' | 'delivered' | 'cancelled'

export type ShipStatus = 'available' | 'berthed' | 'in_transit' | 'maintenance'

export type BerthStatus = 'free' | 'occupied' | 'maintenance'

export type ReservationStatus = 'active' | 'completed' | 'cancelled'

export type QueueStatus = 'waiting' | 'assigned' | 'completed'

export type PaymentType = 'cargo_fee' | 'berth_fee' | 'penalty'

export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export type DocumentType = 'invoice' | 'customs_declaration' | 'bill_of_lading'

export type VerificationStatus = 'pending' | 'verified' | 'flagged'

export type NotificationType = 'cargo_update' | 'berth_update' | 'payment_update' | 'system'

export type DealStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
export type DealType = 'berth_booking' | 'cargo_contract'

export type ChatParticipant = { userId: number; name: string; role: UserRole }
