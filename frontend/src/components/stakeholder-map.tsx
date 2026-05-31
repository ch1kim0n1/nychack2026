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
  for (const f of findings) {
    const key = f.who_to_contact ?? 'Other Requirements'
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        department: f.agency_department,
        phone: f.agency_phone,
        url: f.agency_url ?? f.source_url,
        jurisdiction: f.jurisdiction_level,
        findings: [],
      })
    }
    map.get(key)!.findings.push(f)
  }
  return Array.from(map.values()).sort((a, b) => {
    // Sort by highest risk in the group
    const riskVal = (g: Agency) => g.findings.some(f => f.risk_level === 'high') ? 0 : g.findings.some(f => f.risk_level === 'medium') ? 1 : 2
    return riskVal(a) - riskVal(b)
  })
}

export function StakeholderMap({ findings }: { findings: RiskFinding[] }) {
  const agencies = groupByAgency(findings.filter(f => f.who_to_contact))
  if (agencies.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-h2 text-[var(--cl-text)] mb-4">Stakeholder Map</h2>
      <p className="text-body text-[var(--cl-text-secondary)] mb-5">
        Who owns each compliance requirement — and how to reach them.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agencies.map((agency, i) => (
          <div key={i} className="bg-surface border border-[var(--cl-border)] rounded p-4 shadow-1">
            {/* Agency header */}
            <div className="flex items-start justify-between mb-3">
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

            {/* Contact info */}
            <div className="flex flex-wrap gap-3 mb-3 text-caption">
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

            {/* Findings for this agency */}
            <div className="space-y-2">
              {agency.findings.map((f, j) => (
                <div key={j} className={cn(
                  'rounded border px-3 py-2',
                  f.risk_level === 'high' ? 'border-risk-high-border bg-risk-high-bg'
                  : f.risk_level === 'medium' ? 'border-risk-med-border bg-risk-med-bg'
                  : 'border-[var(--cl-border)] bg-sunken',
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge level={f.risk_level} />
                    <span className="text-body font-semibold text-[var(--cl-text)]">{f.affected_area}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-caption text-[var(--cl-text-muted)]">
                    {f.permit_fee && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={11} strokeWidth={1.5} />
                        {f.permit_fee}
                      </span>
                    )}
                    {f.effective_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} strokeWidth={1.5} />
                        {f.effective_date}
                      </span>
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
