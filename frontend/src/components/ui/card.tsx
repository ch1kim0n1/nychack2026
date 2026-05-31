import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  header?: React.ReactNode
  action?: React.ReactNode
}

export function Card({ className, children, header, action }: CardProps) {
  return (
    <div className={cn('bg-surface border border-[var(--cl-border)] rounded p-4 shadow-1', className)}>
      {(header || action) && (
        <>
          <div className="flex items-center justify-between mb-3">
            {header && <h3 className="text-h3 text-[var(--cl-text)]">{header}</h3>}
            {action && <div className="text-caption text-[var(--cl-text-secondary)]">{action}</div>}
          </div>
          <div className="border-b border-[var(--cl-border-subtle)] mb-3" />
        </>
      )}
      {children}
    </div>
  )
}

export function SummaryCard({
  label,
  value,
  sub,
  mono = false,
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn('bg-surface border border-[var(--cl-border)] rounded p-4 shadow-1', className)}>
      <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">{label}</p>
      <p className={cn('text-h1', mono ? 'font-mono' : 'font-sans', 'text-[var(--cl-text)]')}>{value}</p>
      {sub && <p className="text-caption text-[var(--cl-text-secondary)] mt-0.5">{sub}</p>}
    </div>
  )
}
