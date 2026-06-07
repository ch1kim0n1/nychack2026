'use client'

import { type RiskFinding } from '@/lib/api'
import { cn } from '@/lib/utils'

const JURISDICTIONS = ['City', 'County', 'State', 'Federal', 'Agency', 'Unknown']

function heatColor(level?: string | null) {
  if (!level) return 'bg-sunken text-[var(--cl-text-muted)]'
  if (level === 'high') return 'bg-risk-high-bg text-risk-high-fg border border-risk-high-border font-semibold'
  if (level === 'medium') return 'bg-risk-med-bg text-risk-med-fg border border-risk-med-border'
  return 'bg-risk-low-bg text-risk-low-fg border border-risk-low-border'
}

export function RiskHeatmap({ findings }: { findings: RiskFinding[] }) {
  if (findings.length === 0) return null

  const areas = [...new Set(findings.map((finding) => finding.affected_area))]
  const juriMap: Record<string, Record<string, string>> = {}

  for (const finding of findings) {
    const jurisdiction = finding.jurisdiction_level
      ? finding.jurisdiction_level.charAt(0).toUpperCase() + finding.jurisdiction_level.slice(1)
      : 'Unknown'
    if (!juriMap[jurisdiction]) juriMap[jurisdiction] = {}
    if (!juriMap[jurisdiction][finding.affected_area] || finding.risk_level === 'high') {
      juriMap[jurisdiction][finding.affected_area] = finding.risk_level
    }
  }

  const usedJurisdictions = JURISDICTIONS.filter((jurisdiction) => juriMap[jurisdiction])
  if (usedJurisdictions.length < 2) return null

  return (
    <section className="rounded-lg border border-[var(--cl-border)] bg-surface px-5 py-5 shadow-1">
      <h2 className="text-h2 text-[var(--cl-text)] mb-2">Risk Heatmap</h2>
      <p className="text-body text-[var(--cl-text-secondary)] mb-4">
        Where compliance risk concentrates, by jurisdiction and requirement.
      </p>
      <div className="overflow-x-auto rounded border border-[var(--cl-border-subtle)]">
        <table className="w-full border-collapse text-caption">
          <thead>
            <tr>
              <th className="w-40 bg-navy-800 px-3 py-2 text-left text-label uppercase tracking-[0.06em] text-white">
                Jurisdiction
              </th>
              {areas.map((area) => (
                <th key={area} className="bg-navy-800 px-3 py-2 text-center text-label uppercase tracking-[0.06em] text-white">
                  {area.length > 20 ? `${area.slice(0, 18)}...` : area}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usedJurisdictions.map((jurisdiction, i) => (
              <tr key={jurisdiction} className={i % 2 === 1 ? 'bg-canvas' : ''}>
                <td className="border-t border-[var(--cl-border-subtle)] px-3 py-2 font-semibold text-[var(--cl-text)]">
                  {jurisdiction}
                </td>
                {areas.map((area) => {
                  const level = juriMap[jurisdiction]?.[area]
                  return (
                    <td key={area} className="border-t border-[var(--cl-border-subtle)] px-2 py-2 text-center">
                      {level ? (
                        <span className={cn('inline-block rounded-sm px-2 py-0.5 text-citation font-mono', heatColor(level))}>
                          {level.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[var(--cl-text-muted)]">None</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
