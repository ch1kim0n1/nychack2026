import { type RiskFinding } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Clock, ChevronRight } from 'lucide-react'

const URGENCY_LABELS = { immediate: 'Now', soon: 'Next 30 to 90 days', ongoing: 'Ongoing / renewal' }
const URGENCY_COLORS = {
  immediate: 'bg-risk-high-bg border-risk-high-border text-risk-high-fg',
  soon: 'bg-risk-med-bg border-risk-med-border text-risk-med-fg',
  ongoing: 'bg-risk-low-bg border-risk-low-border text-risk-low-fg',
}

export function PermitTimeline({ findings }: { findings: RiskFinding[] }) {
  const withUrgency = findings.filter((finding) => finding.urgency)
  if (withUrgency.length === 0) return null

  const groups: Record<string, RiskFinding[]> = { immediate: [], soon: [], ongoing: [] }
  for (const finding of withUrgency) {
    if (finding.urgency && groups[finding.urgency]) groups[finding.urgency].push(finding)
  }

  const phases = (['immediate', 'soon', 'ongoing'] as const).filter((phase) => groups[phase].length > 0)
  if (phases.length < 2) return null

  return (
    <section className="rounded-lg border border-[var(--cl-border)] bg-surface px-5 py-5 shadow-1">
      <h2 className="text-h2 text-[var(--cl-text)] mb-2">Permit Path Timeline</h2>
      <p className="text-body text-[var(--cl-text-secondary)] mb-5">
        What to tackle first, in order, from blocking requirements to ongoing renewals.
      </p>

      <div className="flex flex-col gap-4 rounded border border-[var(--cl-border-subtle)] bg-canvas p-4 sm:flex-row sm:gap-0">
        {phases.map((phase, i) => (
          <div key={phase} className="flex items-start sm:flex-1 sm:flex-col">
            <div className={cn(
              'flex w-full items-center gap-2 rounded border px-4 py-2.5 text-body font-semibold sm:w-auto',
              URGENCY_COLORS[phase],
            )}>
              <Clock size={14} strokeWidth={1.5} />
              {URGENCY_LABELS[phase]}
              {i < phases.length - 1 && (
                <ChevronRight size={14} strokeWidth={1.5} className="ml-auto hidden sm:block" />
              )}
            </div>

            <div className="mt-2 flex w-full flex-col gap-2 pl-1 sm:pl-0 sm:pr-4">
              {groups[phase].map((finding, j) => (
                <div key={`${phase}-${j}`} className="flex items-start gap-2">
                  <span className={cn(
                    'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-caption font-mono',
                    URGENCY_COLORS[phase],
                  )}>
                    {j + 1}
                  </span>
                  <div>
                    <p className="text-body font-semibold text-[var(--cl-text)]">{finding.affected_area}</p>
                    {finding.permit_fee && (
                      <p className="text-caption text-[var(--cl-text-muted)]">Est. {finding.permit_fee}</p>
                    )}
                    {finding.effective_date && (
                      <p className="text-caption text-[var(--cl-text-muted)]">By: {finding.effective_date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
