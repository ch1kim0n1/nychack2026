'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { RiskBadge } from '@/components/ui/risk-badge'
import { CitationChip } from '@/components/ui/citation-chip'
import { Button } from '@/components/ui/button'
import { type RiskAnalysisResult, type RiskFinding } from '@/lib/api'
import { KeyRound, AlertTriangle, Printer, ListChecks } from 'lucide-react'

// Before-You-Sign-Lease Checklist (8.8): surfaces the requirements an owner MUST verify
// against a specific property before committing to a lease — the most expensive mistakes.

const LEASE_KEYWORDS = /zoning|occupancy|signage|parking|outdoor|patio|build-?out|renovation|fire marshal|certificate of occupancy|land use|setback|grease|ventilation/i

function isLeaseCritical(f: RiskFinding): boolean {
  if (f.impact_label === 'Must verify before lease') return true
  const haystack = `${f.affected_area} ${f.explanation} ${f.recommended_action}`
  return LEASE_KEYWORDS.test(haystack)
}

export default function LeasePage() {
  const router = useRouter()
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)

  useEffect(() => {
    const json = sessionStorage.getItem('cl-risk-result')
    if (!json) { router.push('/intake'); return }
    setResult(JSON.parse(json))
  }, [router])

  if (!result) return null

  const leaseItems = result.findings.filter(isLeaseCritical)
  const other = result.findings.filter(f => !isLeaseCritical(f))

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" onCompare={() => router.push('/diff')} />
      <DisclaimerBanner />

      <main className="flex-1 px-6 py-6 max-w-[840px] mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-2 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-navy-50 border border-[var(--cl-border)] text-navy-600">
              <KeyRound size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-h1 text-[var(--cl-text)]">Before You Sign a Lease</h1>
              <p className="text-caption text-[var(--cl-text-muted)]">
                Verify these against the specific property — these mistakes can&apos;t be fixed after signing.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-caption text-[var(--cl-text-secondary)] border border-[var(--cl-border)] bg-surface rounded px-3 py-1.5 hover:bg-navy-50 transition-colors"
          >
            <Printer size={14} strokeWidth={1.5} /> Print
          </button>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-2 bg-risk-high-bg border border-risk-high-border rounded px-4 py-3 my-5">
          <AlertTriangle size={16} strokeWidth={1.5} className="text-risk-high-fg shrink-0 mt-0.5" />
          <p className="text-body text-risk-high-fg">
            Zoning and occupancy problems are the #1 cause of failed openings. Confirm every item below
            with the property address <strong>before</strong> you sign — a wrong-zoned location cannot be undone.
          </p>
        </div>

        {/* Lease-critical checklist */}
        {leaseItems.length > 0 ? (
          <div className="space-y-3">
            {leaseItems.map((f, i) => (
              <label
                key={i}
                className="flex items-start gap-3 bg-surface border border-[var(--cl-border)] rounded p-4 shadow-1 cursor-pointer hover:bg-navy-50 transition-colors"
              >
                <input type="checkbox" className="mt-1 w-4 h-4 accent-navy-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <RiskBadge level={f.risk_level} />
                    <h3 className="text-h3 text-[var(--cl-text)]">{f.affected_area}</h3>
                  </div>
                  <p className="text-body text-[var(--cl-text-secondary)] mb-2">{f.explanation}</p>
                  <p className="text-caption text-[var(--cl-text-muted)] mb-2">
                    <strong className="text-[var(--cl-text-secondary)]">Verify:</strong> {f.recommended_action}
                  </p>
                  <CitationChip url={f.source_url} />
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <ListChecks size={32} strokeWidth={1.5} className="text-risk-low-fg" />
            <p className="text-h3 text-[var(--cl-text)]">No lease-critical items flagged for this profile.</p>
            <p className="text-body text-[var(--cl-text-secondary)] max-w-sm">
              Still review the full findings — some requirements may apply after you open.
            </p>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>View all findings</Button>
          </div>
        )}

        {/* Other (post-lease) items, collapsed reference */}
        {other.length > 0 && (
          <div className="mt-8">
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Can be handled after signing ({other.length})
            </p>
            <ul className="space-y-1.5">
              {other.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-body text-[var(--cl-text-secondary)]">
                  <RiskBadge level={f.risk_level} />
                  {f.affected_area}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
