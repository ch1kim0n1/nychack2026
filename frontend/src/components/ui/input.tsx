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
}

export const IntakeTextarea = forwardRef<HTMLTextAreaElement, IntakeTextareaProps>(
  ({ className, onAnalyze, analyzing, value, ...props }, ref) => (
    <div className="cl-glow-card relative rounded-lg border border-[var(--cl-border)] bg-surface shadow-1 focus-within:border-[var(--cl-border-strong)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--cl-navy-600)_40%,transparent)] transition-[border-color,box-shadow] duration-[140ms]">
      <textarea
        ref={ref}
        value={value}
        rows={5}
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
          disabled={!value || String(value).length < 15 || analyzing}
          onClick={onAnalyze}
          className={cn(
            'inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-body font-semibold shadow-1',
            'bg-navy-600 text-white transition-colors duration-[80ms]',
            'hover:bg-navy-700 active:translate-y-px active:bg-navy-800',
            'disabled:opacity-40 disabled:pointer-events-none',
          )}
        >
          {analyzing ? 'Analyzing...' : 'Analyze ->'}
        </button>
      </div>
    </div>
  ),
)
IntakeTextarea.displayName = 'IntakeTextarea'
