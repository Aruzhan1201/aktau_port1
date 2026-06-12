import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const variants = {
  primary:
    'bg-kazakh-burgundy text-heritage-cream hover:bg-kazakh-burgundy-light focus-visible:ring-2 focus-visible:ring-silk-gold/40',
  secondary:
    'bg-silk-gold/20 text-kazakh-burgundy dark:text-silk-gold hover:bg-silk-gold/30 focus-visible:ring-2 focus-visible:ring-silk-gold/40',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500/40',
  ghost:
    'bg-transparent text-modern-slate dark:text-warm-sand hover:bg-silk-gold/20 focus-visible:ring-2 focus-visible:ring-silk-gold/30',
  outline:
    'border border-silk-gold/40 bg-transparent text-kazakh-burgundy dark:text-silk-gold hover:bg-silk-gold/20 focus-visible:ring-2 focus-visible:ring-silk-gold/40',
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-in-out',
        'focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        'hover:scale-[1.02] active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
