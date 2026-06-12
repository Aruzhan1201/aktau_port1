import type { InputHTMLAttributes, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-kazakh-burgundy dark:text-silk-gold"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-modern-slate dark:text-warm-sand">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={cn(
            'block w-full rounded-lg border border-silk-gold/40 px-3 py-2 text-sm text-kazakh-burgundy dark:text-heritage-cream',
            'placeholder:text-modern-slate dark:placeholder:text-warm-sand/50',
            'shadow-sm transition-all duration-200 ease-in-out',
            'bg-heritage-cream dark:bg-kazakh-burgundy-dark',
            'focus:outline-none focus:ring-2 focus:ring-silk-gold/40 focus:border-silk-gold',
            error &&
              'border-status-cancelled focus:ring-status-cancelled/20 focus:border-status-cancelled',
            icon ? 'pl-10' : undefined,
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-status-cancelled" role="alert">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-modern-slate dark:text-warm-sand">{helperText}</p>
      )}
    </div>
  )
}
