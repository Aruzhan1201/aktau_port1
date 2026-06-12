import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PatternBorderProps {
  children: ReactNode
  className?: string
  variant?: 'top' | 'diamond' | 'full'
}

export function PatternBorder({ children, className, variant = 'diamond' }: PatternBorderProps) {
  return (
    <div className={cn(
      variant === 'top' && 'pattern-border-top rounded-xl',
      variant === 'diamond' && 'pattern-border-diamond rounded-xl',
      variant === 'full' && 'border-2 border-silk-gold/30 rounded-xl',
      className
    )}>
      {children}
    </div>
  )
}
