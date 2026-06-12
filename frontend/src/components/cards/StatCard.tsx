import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  iconColor?: string
  trend?: { value: string; positive: boolean }
  onClick?: () => void
  className?: string
  children?: ReactNode
}

export function StatCard({ label, value, icon: Icon, iconColor, trend, onClick, className, children }: StatCardProps) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component
      onClick={onClick}
      className={cn(
        'pattern-border-diamond rounded-xl border border-silk-gold/30 bg-white dark:bg-modern-slate/20 p-5 shadow-sm hover:shadow-md transition-all duration-200 text-left w-full',
        onClick && 'cursor-pointer group',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-modern-slate dark:text-warm-sand uppercase tracking-wider font-sans">
          {label}
        </p>
        {Icon && (
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform',
            iconColor || 'bg-silk-gold/20 text-silk-gold-dark'
          )}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-kazakh-burgundy dark:text-silk-gold font-serif">{value}</p>
      {trend && (
        <p className={cn(
          'text-xs mt-1 font-sans',
          trend.positive ? 'text-emerald-prosperity' : 'text-status-cancelled'
        )}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
      {children}
    </Component>
  )
}
