import { cn } from '@/lib/utils'
import { Shield, ShieldAlert, ShieldQuestion, MapPin } from 'lucide-react'

type ConfidenceLevel = 'high' | 'medium' | 'low'
type JurisdictionLevel = 'city' | 'county' | 'state' | 'federal' | 'agency'

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, {
  icon: React.ReactNode; label: string; classes: string
}> = {
  high:   { icon: <Shield size={11} strokeWidth={1.5} />,       label: 'Verified',  classes: 'text-risk-low-fg bg-risk-low-bg border-risk-low-border' },
  medium: { icon: <ShieldAlert size={11} strokeWidth={1.5} />,  label: 'Likely',    classes: 'text-risk-med-fg bg-risk-med-bg border-risk-med-border' },
  low:    { icon: <ShieldQuestion size={11} strokeWidth={1.5}/>, label: 'Uncertain', classes: 'text-risk-high-fg bg-risk-high-bg border-risk-high-border' },
}

const JURISDICTION_LABELS: Record<JurisdictionLevel, string> = {
  city:    'City',
  county:  'County',
  state:   'State',
  federal: 'Federal',
  agency:  'Agency',
}

export function ConfidenceBadge({ level, className }: { level: ConfidenceLevel; className?: string }) {
  const cfg = CONFIDENCE_CONFIG[level]
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border font-mono text-citation',
      cfg.classes, className,
    )}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

export function JurisdictionBadge({ level, className }: { level: JurisdictionLevel; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border font-mono text-citation',
      'text-navy-600 bg-navy-50 border-[var(--cl-border)]',
      className,
    )}>
      <MapPin size={10} strokeWidth={1.5} />
      {JURISDICTION_LABELS[level]}
    </span>
  )
}

export function SourceFreshnessBadge({ lastCheckedAt, className }: { lastCheckedAt?: string; className?: string }) {
  if (!lastCheckedAt) return null
  const days = Math.floor((Date.now() - new Date(lastCheckedAt).getTime()) / 86400000)
  const stale = days > 30

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border font-mono text-citation',
      stale
        ? 'text-risk-med-fg bg-risk-med-bg border-risk-med-border'
        : 'text-[var(--cl-text-muted)] bg-sunken border-[var(--cl-border)]',
      className,
    )}>
      {stale ? `Checked ${days}d ago` : `Checked ${days === 0 ? 'today' : `${days}d ago`}`}
    </span>
  )
}
