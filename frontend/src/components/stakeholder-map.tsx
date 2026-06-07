import { type RiskFinding } from '@/lib/api'
import { RiskBadge } from '@/components/ui/risk-badge'
import { JurisdictionBadge } from '@/components/ui/trust-badges'
import { Phone, ExternalLink, DollarSign, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Agency {
  name: string
  department?: string
  phone?: string
  url?: string
  jurisdiction?: string
  findings: RiskFinding[]
}

function groupByAgency(findings: RiskFinding[]): Agency[] {
  const map = new Map<string, Agency>()
  for (const finding of findings) {
    const key = finding.who_to_contact ?? 'Other Requirements'
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        department: finding.agency_department,
        phone: finding.agency_phone,
        url: finding.agency_url ?? finding.source_url,
        jurisdiction: finding.jurisdiction_level,
        findings: [],
      })
    }
    map.get(key)!.findings.push(finding)
  }
  return Array.from(map.values()).sort((a, b) => {
    const riskVal = (agency: Agency) =>
      agency.findings.some((finding) => finding.risk_level === 'high') ? 0
        : agency.findings.some((finding) => finding.risk_level === 'medium') ? 1
          : 2
    return riskVal(a) - riskVal(b)
  })
}

export function StakeholderMap({ findings }: { findings: RiskFinding[] }) {
  const agencies = groupByAgency(findings.filter((finding) => finding.who_to_contact))
  if (agencies.length === 0) return null

  return (
    <section className="rounded-lg border border-[var(--cl-border)] bg-surface px-5 py-5 shadow-1">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-h2 text-[var(--cl-text)]">Stakeholder Map</h2>
          <p className="mt-1 text-body text-[var(--cl-text-secondary)]">
            Who owns each compliance requirement, and how to reach them.
          </p>
        </div>
        <p className="font-mono text-citation text-[var(--cl-text-muted)]">
          {agencies.length} agency contact{agencies.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-hidden rounded border border-[var(--cl-border-subtle)]">
        {agencies.map((agency, i) => (
          <div key={agency.name} className="grid gap-4 border-b border-[var(--cl-border-subtle)] bg-surface px-4 py-4 last:border-b-0 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-h3 text-[var(--cl-text)]">{agency.name}</h3>
                  {agency.department && (
                    <p className="text-caption text-[var(--cl-text-muted)]">{agency.department}</p>
                  )}
                </div>
                {agency.jurisdiction && (
                  <JurisdictionBadge level={agency.jurisdiction as 'city' | 'county' | 'state' | 'federal' | 'agency'} />
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-caption">
                {agency.phone && (
                  <a href={`tel:${agency.phone}`} className="flex items-center gap-1 text-navy-600 hover:underline">
                    <Phone size={12} strokeWidth={1.5} />
                    {agency.phone}
                  </a>
                )}
                {agency.url && (
                  <a href={agency.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-citation text-navy-600 hover:underline">
                    Visit site <ExternalLink size={10} strokeWidth={1.5} />
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {agency.findings.map((finding, j) => (
                <div key={`${i}-${j}`} className={cn(
                  'rounded border px-3 py-2',
                  finding.risk_level === 'high' ? 'border-risk-high-border bg-risk-high-bg'
                    : finding.risk_level === 'medium' ? 'border-risk-med-border bg-risk-med-bg'
                      : 'border-[var(--cl-border)] bg-sunken',
                )}>
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge level={finding.risk_level} />
                    <span className="text-body font-semibold text-[var(--cl-text)]">{finding.affected_area}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-caption text-[var(--cl-text-muted)]">
                    {finding.permit_fee && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={11} strokeWidth={1.5} />
                        {finding.permit_fee}
                      </span>
                    )}
                    {finding.effective_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} strokeWidth={1.5} />
                        {finding.effective_date}
                      </span>
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
