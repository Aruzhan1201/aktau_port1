import type { CargoStatus, BerthStatus, QueueStatus, ReservationStatus, VerificationStatus, PaymentStatus } from '@/types/enums'

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const statusColorMap: Record<CargoStatus, string> = {
  created: 'bg-badge-created-bg text-badge-created-text',
  approved: 'bg-badge-approved-bg text-badge-approved-text',
  assigned: 'bg-badge-assigned-bg text-badge-assigned-text',
  loading: 'bg-badge-loading-bg text-badge-loading-text',
  in_transit: 'bg-badge-transit-bg text-badge-transit-text',
  arrived: 'bg-badge-arrived-bg text-badge-arrived-text',
  delivered: 'bg-badge-delivered-bg text-badge-delivered-text',
  cancelled: 'bg-badge-cancelled-bg text-badge-cancelled-text',
}

export const statusLabelMap: Record<CargoStatus, string> = {
  created: 'Created',
  approved: 'Approved',
  assigned: 'Assigned',
  loading: 'Loading',
  in_transit: 'In Transit',
  arrived: 'Arrived',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const berthStatusColorMap: Record<BerthStatus, string> = {
  free: 'bg-berth-free',
  occupied: 'bg-berth-occupied',
  maintenance: 'bg-berth-maintenance',
}

export const berthStatusLabelMap: Record<BerthStatus, string> = {
  free: 'Free',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
}

export const queueStatusLabelMap: Record<QueueStatus, string> = {
  waiting: 'Waiting',
  assigned: 'Assigned',
  completed: 'Completed',
}

export const reservationStatusLabelMap: Record<ReservationStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const verificationStatusLabelMap: Record<VerificationStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  flagged: 'Flagged',
}

export const verificationStatusColorMap: Record<VerificationStatus, string> = {
  pending: 'bg-badge-pending-bg text-badge-pending-text',
  verified: 'bg-badge-verified-bg text-badge-verified-text',
  flagged: 'bg-badge-flagged-bg text-badge-flagged-text',
}

export const paymentStatusLabelMap: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  refunded: 'Refunded',
}

export const paymentStatusColorMap: Record<PaymentStatus, string> = {
  pending: 'bg-badge-pending-bg text-badge-pending-text',
  paid: 'bg-badge-paid-bg text-badge-paid-text',
  refunded: 'bg-badge-refunded-bg text-badge-refunded-text',
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleString()
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatWeight(weight: number): string {
  return `${weight.toLocaleString()}t`
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
