import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge, BerthStatusBadge, VerificationBadge, PaymentBadge } from '@/components/ui/badge'

describe('StatusBadge', () => {
  it('renders with correct label for each status', () => {
    const { rerender } = render(<StatusBadge status="created" />)
    expect(screen.getByText('Created')).toBeInTheDocument()

    rerender(<StatusBadge status="in_transit" />)
    expect(screen.getByText('In Transit')).toBeInTheDocument()

    rerender(<StatusBadge status="delivered" />)
    expect(screen.getByText('Delivered')).toBeInTheDocument()

    rerender(<StatusBadge status="cancelled" />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })
})

describe('BerthStatusBadge', () => {
  it('renders with correct label', () => {
    render(<BerthStatusBadge status="free" />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })
})

describe('VerificationBadge', () => {
  it('renders with correct label', () => {
    render(<VerificationBadge status="verified" />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })
})

describe('PaymentBadge', () => {
  it('renders with correct label', () => {
    render(<PaymentBadge status="paid" />)
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })
})
