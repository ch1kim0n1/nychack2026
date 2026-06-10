'use client'

import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

const base =
  'w-full bg-surface border border-[var(--cl-border)] rounded text-body text-[var(--cl-text)] placeholder:text-[var(--cl-text-muted)] ' +
  'transition-[border-color,box-shadow] duration-[140ms] ' +
  'focus:outline-none focus:border-[var(--cl-border-strong)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cl-navy-600)_40%,transparent)] focus:ring-offset-0 ' +
  'disabled:opacity-40'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(base, 'h-10 px-3', className)}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

interface IntakeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  onAnalyze?: () => void
  analyzing?: boolean
  invalid?: boolean
}

export const IntakeTextarea = forwardRef<HTMLTextAreaElement, IntakeTextareaProps>(
  ({ className, onAnalyze, analyzing, invalid = false, value, ...props }, ref) => (
    <div
      className={cn(
        'cl-glow-card relative rounded-lg border bg-surface shadow-1 transition-[border-color,box-shadow] duration-[140ms]',
        invalid
          ? 'border-risk-high-border ring-2 ring-[color-mix(in_srgb,var(--cl-risk-high-fg)_18%,transparent)]'
          : 'border-[var(--cl-border)] focus-within:border-[var(--cl-border-strong)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--cl-navy-600)_40%,transparent)]',
      )}
    >
      <textarea
        ref={ref}
        value={value}
        rows={5}
        aria-invalid={invalid}
        className={cn(
          'w-full bg-transparent resize-none px-5 pt-5 pb-16 text-body-lg font-sans',
          'text-[var(--cl-text)] placeholder:text-[var(--cl-text-muted)] placeholder:font-mono placeholder:text-body',
          'focus:outline-none',
          className,
        )}
        {...props}
      />
      <div className="absolute bottom-3 right-3">
        <button
          type="button"
          disabled={analyzing}
          onClick={onAnalyze}
          className={cn(
            'inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-body font-semibold shadow-1',
            'bg-navy-600 text-white transition-colors duration-[80ms]',
            'hover:bg-navy-700 active:translate-y-px active:bg-navy-800',
            'disabled:opacity-40 disabled:cursor-wait',
          )}
        >
          {analyzing ? 'Analyzing...' : 'Analyze ->'}
        </button>
      </div>
    </div>
  ),
)
IntakeTextarea.displayName = 'IntakeTextarea'
