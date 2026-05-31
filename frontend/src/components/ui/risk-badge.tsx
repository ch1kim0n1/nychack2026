import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, Info } from 'lucide-react'

export type RiskLevel = 'high' | 'medium' | 'low'

const config: Record<RiskLevel, { label: string; icon: React.ReactNode; classes: string }> = {
  high: {
    label: 'HIGH',
    icon: <AlertTriangle size={12} strokeWidth={1.5} />,
    classes: 'text-risk-high-fg bg-risk-high-bg border-risk-high-border',
  },
  medium: {
    label: 'MEDIUM',
    icon: <Clock size={12} strokeWidth={1.5} />,
    classes: 'text-risk-med-fg bg-risk-med-bg border-risk-med-border',
  },
  low: {
    label: 'LOW',
    icon: <Info size={12} strokeWidth={1.5} />,
    classes: 'text-risk-low-fg bg-risk-low-bg border-risk-low-border',
  },
}

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const { label, icon, classes } = config[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border',
        'font-mono text-citation uppercase tracking-wide',
        classes,
        className,
      )}
    >
      {icon}
      {label}
    </span>
  )
}
