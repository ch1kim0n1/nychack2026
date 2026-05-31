import { type RiskFinding } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Clock, ChevronRight } from 'lucide-react'

const URGENCY_ORDER = { immediate: 0, soon: 1, ongoing: 2 }
const URGENCY_LABELS = { immediate: 'Now', soon: 'Next 30–90 days', ongoing: 'Ongoing / renewal' }
const URGENCY_COLORS = {
  immediate: 'bg-risk-high-bg border-risk-high-border text-risk-high-fg',
  soon:      'bg-risk-med-bg border-risk-med-border text-risk-med-fg',
  ongoing:   'bg-risk-low-bg border-risk-low-border text-risk-low-fg',
}

export function PermitTimeline({ findings }: { findings: RiskFinding[] }) {
  const withUrgency = findings.filter(f => f.urgency)
  if (withUrgency.length === 0) return null

  const groups: Record<string, RiskFinding[]> = { immediate: [], soon: [], ongoing: [] }
  for (const f of withUrgency) {
    if (f.urgency && groups[f.urgency]) groups[f.urgency].push(f)
  }

  const phases = (['immediate', 'soon', 'ongoing'] as const).filter(p => groups[p].length > 0)
  if (phases.length < 2) return null

  return (
    <div className="mt-8">
      <h2 className="text-h2 text-[var(--cl-text)] mb-2">Permit Path Timeline</h2>
      <p className="text-body text-[var(--cl-text-secondary)] mb-5">
        What to tackle first, in order — from blocking requirements to ongoing renewals.
      </p>

      <div className="flex flex-col sm:flex-row gap-0">
        {phases.map((phase, i) => (
          <div key={phase} className="flex sm:flex-col items-start sm:flex-1">
            {/* Phase header */}
            <div className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-t border font-semibold text-body w-full sm:w-auto',
              URGENCY_COLORS[phase],
            )}>
              <Clock size={14} strokeWidth={1.5} />
              {URGENCY_LABELS[phase]}
              {i < phases.length - 1 && (
                <ChevronRight size={14} strokeWidth={1.5} className="ml-auto hidden sm:block" />
              )}
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-2 mt-2 w-full sm:pr-4 pl-1 sm:pl-0">
              {groups[phase].map((f, j) => (
                <div key={j} className="flex items-start gap-2">
                  <span className={cn(
                    'mt-1 w-5 h-5 rounded-full border flex items-center justify-center text-caption font-mono shrink-0',
                    URGENCY_COLORS[phase],
                  )}>
                    {j + 1}
                  </span>
                  <div>
                    <p className="text-body font-semibold text-[var(--cl-text)]">{f.affected_area}</p>
                    {f.permit_fee && (
                      <p className="text-caption text-[var(--cl-text-muted)]">Est. {f.permit_fee}</p>
                    )}
                    {f.effective_date && (
                      <p className="text-caption text-[var(--cl-text-muted)]">By: {f.effective_date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
