import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  statusColorMap,
  statusLabelMap,
  berthStatusColorMap,
  berthStatusLabelMap,
  verificationStatusColorMap,
  verificationStatusLabelMap,
  paymentStatusColorMap,
  paymentStatusLabelMap,
} from '@/lib/utils'
import type {
  CargoStatus,
  BerthStatus,
  VerificationStatus,
  PaymentStatus,
} from '@/types'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function DotBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full', className)}
      aria-hidden="true"
    />
  )
}

export function StatusBadge({ status }: { status: CargoStatus }) {
  const isSoft = statusColorMap[status]?.startsWith('bg-slate')
  return (
    <Badge
      className={cn(
        'gap-1.5',
        isSoft
          ? statusColorMap[status]
          : `${statusColorMap[status]} text-white`,
      )}
    >
      {!isSoft && <DotBadge className={statusColorMap[status]} />}
      {statusLabelMap[status]}
    </Badge>
  )
}

export function BerthStatusBadge({ status }: { status: BerthStatus }) {
  return (
    <Badge className={`gap-1.5 ${berthStatusColorMap[status]} text-white`}>
      <DotBadge className={berthStatusColorMap[status]} />
      {berthStatusLabelMap[status]}
    </Badge>
  )
}

export function VerificationBadge({
  status,
}: {
  status: VerificationStatus
}) {
  return (
    <Badge className={`text-white ${verificationStatusColorMap[status]}`}>
      {verificationStatusLabelMap[status]}
    </Badge>
  )
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={`text-white ${paymentStatusColorMap[status]}`}>
      {paymentStatusLabelMap[status]}
    </Badge>
  )
}
