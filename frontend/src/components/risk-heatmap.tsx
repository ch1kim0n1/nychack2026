'use client'

import { type RiskFinding } from '@/lib/api'
import { cn } from '@/lib/utils'

const JURISDICTIONS = ['City', 'County', 'State', 'Federal', 'Agency', 'Unknown']
const ACTIVITIES_LABELS: Record<string, string> = {
  food_preparation:  'Food prep',
  alcohol_planned:   'Alcohol',
  outdoor_seating:   'Outdoor seating',
  food_service:      'Food service',
  hiring_employees:  'Hiring',
  delivery:          'Delivery',
  nail_services:     'Nail services',
  cosmetology:       'Cosmetology',
  construction_work: 'Construction',
  retail_sales:      'Retail',
}

function heatColor(level?: string | null) {
  if (!level) return 'bg-sunken text-[var(--cl-text-muted)]'
  if (level === 'high')   return 'bg-risk-high-bg text-risk-high-fg border border-risk-high-border font-semibold'
  if (level === 'medium') return 'bg-risk-med-bg text-risk-med-fg border border-risk-med-border'
  return 'bg-risk-low-bg text-risk-low-fg border border-risk-low-border'
}

export function RiskHeatmap({ findings }: { findings: RiskFinding[] }) {
  if (findings.length === 0) return null

  // Build a jurisdiction × area grid
  const areas = [...new Set(findings.map(f => f.affected_area))]
  const juriMap: Record<string, Record<string, string>> = {}

  for (const f of findings) {
    const j = f.jurisdiction_level
      ? f.jurisdiction_level.charAt(0).toUpperCase() + f.jurisdiction_level.slice(1)
      : 'Unknown'
    if (!juriMap[j]) juriMap[j] = {}
    if (!juriMap[j][f.affected_area] || f.risk_level === 'high') {
      juriMap[j][f.affected_area] = f.risk_level
    }
  }

  const usedJurisdictions = JURISDICTIONS.filter(j => juriMap[j])
  if (usedJurisdictions.length < 2) return null // Not enough data for a meaningful grid

  return (
    <div className="mt-8">
      <h2 className="text-h2 text-[var(--cl-text)] mb-2">Risk Heatmap</h2>
      <p className="text-body text-[var(--cl-text-secondary)] mb-4">
        Where compliance risk concentrates, by jurisdiction and requirement.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-caption border-collapse">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 bg-navy-800 text-white text-label uppercase tracking-[0.06em] w-40 rounded-tl">
                Jurisdiction
              </th>
              {areas.map(a => (
                <th key={a} className="px-3 py-2 bg-navy-800 text-white text-label uppercase tracking-[0.06em] text-center last:rounded-tr">
                  {a.length > 20 ? a.slice(0, 18) + '…' : a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usedJurisdictions.map((j, i) => (
              <tr key={j} className={i % 2 === 1 ? 'bg-canvas' : ''}>
                <td className="px-3 py-2 font-semibold text-[var(--cl-text)] border-t border-[var(--cl-border-subtle)]">
                  {j}
                </td>
                {areas.map(area => {
                  const level = juriMap[j]?.[area]
                  return (
                    <td key={area} className="px-2 py-2 text-center border-t border-[var(--cl-border-subtle)]">
                      {level ? (
                        <span className={cn('inline-block px-2 py-0.5 rounded-sm text-citation font-mono', heatColor(level))}>
                          {level.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[var(--cl-text-muted)]">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
