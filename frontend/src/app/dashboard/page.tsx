'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { RiskBadge } from '@/components/ui/risk-badge'
import { CitationChip } from '@/components/ui/citation-chip'
import { SummaryCard } from '@/components/ui/card'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import { api, type BusinessProfile, type RiskFinding, type RiskAnalysisResult } from '@/lib/api'
import { staggerRows } from '@/lib/gsap'
import { ChevronDown, ChevronRight, ExternalLink, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [degraded, setDegraded] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [drawerFinding, setDrawerFinding] = useState<RiskFinding | null>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  const findingsRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    async function load() {
      try {
        const profileJson = sessionStorage.getItem('cl-profile')
        let data: RiskAnalysisResult

        if (profileJson) {
          const profile: BusinessProfile = JSON.parse(profileJson)
          try {
            data = await api.analyzeRisk(profile)
          } catch {
            // Live analysis failed — fall back to demo data and flag degraded
            data = await api.getDemoRisk()
            setDegraded(true)
          }
        } else {
          data = await api.getDemoRisk()
        }
        setResult(data)
      } catch {
        setError('Could not load risk analysis. Try the demo scenario or go back to retry.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Risk-score count-up (700ms, power1.out) — runs once after data lands
  useEffect(() => {
    if (!result || hasAnimated.current || !scoreRef.current) return
    hasAnimated.current = true
    const target = result.risk_score
    const duration = 700
    const start = performance.now()
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = t < 1 ? t * t : 1
      if (scoreRef.current) scoreRef.current.textContent = String(Math.round(eased * target))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [result])

  // GSAP stagger on findings rows after they render
  useEffect(() => {
    if (!result || !findingsRef.current) return
    const rows = findingsRef.current.querySelectorAll('[data-finding-row]')
    if (rows.length) staggerRows(rows)
  }, [result])

  const profileInput = typeof window !== 'undefined'
    ? sessionStorage.getItem('cl-input') ?? undefined
    : undefined

  const highCount = result?.findings.filter(f => f.risk_level === 'high').length ?? 0
  const medCount  = result?.findings.filter(f => f.risk_level === 'medium').length ?? 0
  const lowCount  = result?.findings.filter(f => f.risk_level === 'low').length ?? 0

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav
        variant="app"
        businessSummary={profileInput ? profileInput.slice(0, 60) + (profileInput.length > 60 ? '…' : '') : undefined}
        onCompare={() => router.push('/diff')}
      />
      <DisclaimerBanner />

      {/* Degraded / partial banner */}
      {degraded && (
        <div className="bg-risk-med-bg border-b border-risk-med-border px-6 py-2 flex items-center gap-2 text-caption text-risk-med-fg">
          <AlertTriangle size={13} strokeWidth={1.5} className="shrink-0" />
          Live analysis unavailable — showing cached demo results. Some sources may be incomplete.
          <button className="ml-auto underline" onClick={() => router.push('/intake')}>Re-analyze</button>
        </div>
      )}

      <main className="flex-1 px-6 py-6 max-w-app mx-auto w-full">
        {loading && <DashboardSkeleton />}

        {error && !loading && (
          <div className="bg-risk-high-bg border border-risk-high-border rounded p-4 text-body text-risk-high-fg">
            {error}
            <div className="mt-3 flex gap-3">
              <button
                className="text-caption underline"
                onClick={() => { sessionStorage.removeItem('cl-profile'); window.location.reload() }}
              >
                Try demo data
              </button>
              <button className="text-caption underline" onClick={() => router.push('/intake')}>
                Go back
              </button>
            </div>
          </div>
        )}

        {result && !loading && (
          <>
            {/* ── Summary row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <SummaryCard
                label="Risk Score"
                value={<><span ref={scoreRef}>0</span><span className="text-h3 text-[var(--cl-text-secondary)]"> / 100</span></>}
                mono
              />
              <SummaryCard
                label="Findings"
                value={result.findings.length}
                sub={result.findings.length > 0
                  ? <span className="font-mono">{highCount}H · {medCount}M · {lowCount}L</span>
                  : undefined}
              />
              <SummaryCard
                label="Top Priority"
                value={result.findings[0]?.affected_area ?? 'None'}
                sub={result.findings[0] ? <RiskBadge level={result.findings[0].risk_level} /> : undefined}
              />
            </div>

            {/* ── Empty state ── */}
            {result.findings.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <CheckCircle size={32} strokeWidth={1.5} className="text-risk-low-fg" />
                <h2 className="text-h2 text-[var(--cl-text)]">No high-risk findings for this profile.</h2>
                <p className="text-body text-[var(--cl-text-secondary)] max-w-sm">
                  We checked all available sources for your business type and location and found nothing requiring immediate action.
                </p>
                <p className="text-caption text-[var(--cl-text-muted)] font-mono">
                  Sources checked: TABC · Austin APH · Dallas Code Compliance · TX Comptroller
                </p>
              </div>
            )}

            {/* ── Findings list ── */}
            {result.findings.length > 0 && (
              <div ref={findingsRef} className="flex flex-col gap-2">
                {result.findings.map((finding, i) => (
                  <FindingRow
                    key={i}
                    finding={finding}
                    expanded={expanded.has(i)}
                    onToggle={() => setExpanded(prev => {
                      const next = new Set(prev)
                      next.has(i) ? next.delete(i) : next.add(i)
                      return next
                    })}
                    onCitationClick={() => setDrawerFinding(finding)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {drawerFinding && (
        <CitationDrawer finding={drawerFinding} onClose={() => setDrawerFinding(null)} />
      )}
    </div>
  )
}

function FindingRow({
  finding, expanded, onToggle, onCitationClick,
}: {
  finding: RiskFinding
  expanded: boolean
  onToggle: () => void
  onCitationClick: () => void
}) {
  return (
    <div data-finding-row className="bg-surface border border-[var(--cl-border)] rounded shadow-1">
      <div
        className="flex items-start justify-between gap-4 p-4 cursor-pointer hover:bg-navy-50 transition-colors duration-[120ms]"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3 min-w-0">
          <RiskBadge level={finding.risk_level} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="text-h3 text-[var(--cl-text)] leading-snug">{finding.affected_area}</h3>
            <p className="text-body text-[var(--cl-text-secondary)] mt-1 line-clamp-2">{finding.explanation}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span onClick={e => e.stopPropagation()}>
            <CitationChip url={finding.source_url} onClick={onCitationClick} />
          </span>
          {expanded
            ? <ChevronDown size={16} className="text-[var(--cl-text-muted)]" />
            : <ChevronRight size={16} className="text-[var(--cl-text-muted)]" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--cl-border-subtle)] pt-3 space-y-2">
          <p className="text-body text-[var(--cl-text)]">{finding.explanation}</p>
          <p className="text-caption text-[var(--cl-text-secondary)]">
            <strong>Next step:</strong> {finding.recommended_action}
          </p>
          <CitationChip url={finding.source_url} onClick={onCitationClick} />
        </div>
      )}
    </div>
  )
}

function CitationDrawer({ finding, onClose }: { finding: RiskFinding; onClose: () => void }) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Focus trap — per accessibility spec §7
  useEffect(() => {
    const el = drawerRef.current
    if (!el) return
    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')
    )
    focusable[0]?.focus()

    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [])

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-[200ms]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Finding detail: ${finding.affected_area}`}
        className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-surface shadow-3 z-50 flex flex-col overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cl-border-subtle)]">
          <RiskBadge level={finding.risk_level} />
          <button
            onClick={onClose}
            aria-label="Close finding detail"
            className="p-1.5 rounded text-[var(--cl-text-muted)] hover:text-[var(--cl-text)] transition-colors focus-visible:outline-2"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-5 py-5 flex flex-col gap-5 flex-1">
          <h2 className="text-h2 text-[var(--cl-text)]">{finding.affected_area}</h2>

          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">What this means</p>
            <p className="text-body-lg text-[var(--cl-text)]">{finding.explanation}</p>
          </section>

          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">What to do</p>
            <p className="text-body text-[var(--cl-text)]">{finding.recommended_action}</p>
          </section>

          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">Source</p>
            <div className="bg-sunken border border-[var(--cl-border)] rounded p-3 font-mono text-citation">
              <p className="text-[var(--cl-text-secondary)] mb-1 break-all">
                {finding.source_url.replace(/^https?:\/\//, '')}
              </p>
              <a
                href={finding.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-navy-600 hover:underline focus-visible:outline-2"
              >
                Open source <ExternalLink size={11} strokeWidth={1.5} />
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
