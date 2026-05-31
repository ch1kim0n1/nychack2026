'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:     'bg-navy-600 text-white hover:bg-navy-700 active:bg-navy-800',
  secondary:   'bg-navy-100 text-navy-700 border border-[var(--cl-border)] hover:bg-navy-50 hover:border-[var(--cl-border-strong)]',
  ghost:       'bg-transparent text-navy-700 hover:bg-navy-50',
  destructive: 'bg-risk-high-bg text-risk-high-fg border border-risk-high-border hover:opacity-90',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-caption',
  md: 'h-9 px-4 text-body',
  lg: 'h-11 px-5 text-body-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-sans font-semibold',
        'transition-colors duration-[80ms] select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-40 disabled:pointer-events-none',
        'active:translate-y-px',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
