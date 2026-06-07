'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { RiskBadge } from '@/components/ui/risk-badge'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { api, type RiskAnalysisResult, type RiskFinding } from '@/lib/api'
import { Printer, ExternalLink, FileText, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReportPage() {
  const router = useRouter()
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)
  const [input, setInput] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const [reportDate] = useState(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))

  useEffect(() => {
    const json = sessionStorage.getItem('cl-risk-result')
    if (!json) {
      api.getDemoRisk()
        .then(data => { setResult(data); setIsDemo(true) })
        .catch(() => router.push('/intake'))
      return
    }
    setResult(JSON.parse(json))
    setInput(sessionStorage.getItem('cl-input') ?? '')
  }, [router])

  if (!result) return null

  const highCount  = result.findings.filter(f => f.risk_level === 'high').length
  const medCount   = result.findings.filter(f => f.risk_level === 'medium').length
  const lowCount   = result.findings.filter(f => f.risk_level === 'low').length

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Screen-only nav */}
      <div className="no-print">
        <Nav variant="app" />
        <DisclaimerBanner />
        {isDemo && (
          <div className="bg-risk-med-bg border-b border-risk-med-border px-6 py-2 flex items-center gap-2 text-caption text-risk-med-fg">
            <AlertTriangle size={13} strokeWidth={1.5} className="shrink-0" />
            Showing demo data.
            <button onClick={() => router.push('/intake')} className="underline ml-1">Run a real scan</button> to see your report.
          </div>
        )}
      </div>

      <main className="flex-1 max-w-[840px] mx-auto w-full px-8 py-8">
        {/* Print/download button, screen only */}
        <div className="flex justify-end mb-6 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-navy-600 text-white rounded px-4 py-2 text-body font-semibold hover:bg-navy-700 transition-colors"
          >
            <Printer size={15} strokeWidth={1.5} />
            Print / Save PDF
          </button>
        </div>

        {/* ── Report document ── */}
        <article className="bg-surface border border-[var(--cl-border)] rounded shadow-1 print-full-width">
          {/* Report header */}
          <div className="border-b-2 border-navy-800 px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-citation text-[var(--cl-text-muted)] uppercase tracking-widest mb-1">CivicLens · Regulatory Risk Report</p>
                <h1 className="text-h1 text-[var(--cl-text)]">Compliance Risk Assessment</h1>
              </div>
              <div className="text-right font-mono text-caption text-[var(--cl-text-muted)]">
                <p>Generated: {reportDate}</p>
                <p className="mt-0.5">Risk score: <strong className="text-[var(--cl-text)]">{result.risk_score}/100</strong></p>
              </div>
            </div>
          </div>

          {/* Business context */}
          {input && (
            <div className="px-8 py-5 border-b border-[var(--cl-border-subtle)] bg-sunken">
              <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Business description</p>
              <p className="text-body text-[var(--cl-text)]">{input}</p>
            </div>
          )}

          {/* Summary */}
          <div className="px-8 py-5 border-b border-[var(--cl-border-subtle)]">
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">Summary</p>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Risk Score', value: `${result.risk_score}/100`, mono: true },
                { label: 'High',   value: String(highCount), color: 'text-risk-high-fg' },
                { label: 'Medium', value: String(medCount),  color: 'text-risk-med-fg' },
                { label: 'Low',    value: String(lowCount),  color: 'text-risk-low-fg' },
              ].map(card => (
                <div key={card.label} className="text-center border border-[var(--cl-border)] rounded p-3">
                  <p className="text-caption text-[var(--cl-text-muted)] mb-0.5">{card.label}</p>
                  <p className={cn('text-h2', card.mono && 'font-mono', card.color)}>{card.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Findings */}
          <div className="px-8 py-5">
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-4">
              Findings ({result.findings.length} total, sorted by priority)
            </p>
            <div className="space-y-6">
              {result.findings.map((f, i) => (
                <ReportFinding key={i} finding={f} index={i + 1} />
              ))}
            </div>
          </div>

          {/* Consultant handoff section */}
          <div className="px-8 py-5 border-t border-[var(--cl-border-subtle)] bg-sunken">
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">For your lawyer / accountant / permit consultant</p>
            <p className="text-body text-[var(--cl-text)] mb-3">
              The following items were identified as requiring professional review before proceeding.
              Each item includes the source citation so your advisor can verify the current requirement.
            </p>
            <ul className="space-y-2">
              {result.findings.filter(f => f.risk_level === 'high').map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-body">
                  <span className="font-mono text-citation text-[var(--cl-text-muted)] mt-0.5">{i + 1}.</span>
                  <div>
                    <span className="font-semibold text-[var(--cl-text)]">{f.affected_area}</span>
                    {': '}
                    <span className="text-[var(--cl-text-secondary)]">{f.explanation}</span>
                    <span className="font-mono text-citation text-navy-600 block mt-0.5">
                      Source: {f.source_url}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer footer */}
          <div className="px-8 py-4 border-t-2 border-navy-800 bg-navy-50">
            <p className="text-caption text-[var(--cl-text-muted)]">
              <strong>Informational guidance, not legal advice.</strong> This report was generated by CivicLens using
              publicly available regulatory sources. All findings include citations; verify each source before taking action.
              CivicLens is not a law firm and this report does not constitute legal, tax, or professional advice.
            </p>
          </div>
        </article>
      </main>
    </div>
  )
}

function ReportFinding({ finding, index }: { finding: RiskFinding; index: number }) {
  return (
    <div className="border border-[var(--cl-border)] rounded overflow-hidden">
      {/* Finding header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--cl-border-subtle)] bg-sunken">
        <span className="font-mono text-data text-[var(--cl-text-muted)]">{index}</span>
        <RiskBadge level={finding.risk_level} />
        {finding.impact_label && (
          <span className="font-mono text-citation text-[var(--cl-text-secondary)] border border-[var(--cl-border)] rounded-sm px-2 py-0.5 bg-surface">
            {finding.impact_label}
          </span>
        )}
        <h3 className="text-h3 text-[var(--cl-text)] ml-1">{finding.affected_area}</h3>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Explanation */}
        <p className="text-body text-[var(--cl-text)]">{finding.explanation}</p>

        {/* Recommended action */}
        <div className="bg-navy-50 border border-[var(--cl-border-subtle)] rounded px-3 py-2">
          <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Recommended action</p>
          <p className="text-body text-[var(--cl-text)]">{finding.recommended_action}</p>
        </div>

        {/* Playbook, condensed */}
        {(finding.who_to_contact || (finding.documents_needed && finding.documents_needed.length > 0)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {finding.who_to_contact && (
              <div>
                <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Contact</p>
                <p className="text-body text-[var(--cl-text-secondary)]">{finding.who_to_contact}</p>
              </div>
            )}
            {finding.documents_needed && finding.documents_needed.length > 0 && (
              <div>
                <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Documents needed</p>
                <ul className="space-y-0.5">
                  {finding.documents_needed.map((d, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-body text-[var(--cl-text-secondary)]">
                      <FileText size={12} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Citation */}
        <div className="font-mono text-citation">
          <a
            href={finding.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-navy-600 hover:underline"
          >
            {finding.source_url.replace(/^https?:\/\//, '')}
            <ExternalLink size={10} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  )
}
