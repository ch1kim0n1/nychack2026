'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { RiskBadge } from '@/components/ui/risk-badge'
import { CitationChip } from '@/components/ui/citation-chip'
import { SummaryCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import { api, type BusinessProfile, type RiskFinding, type RiskAnalysisResult, type DraftResult } from '@/lib/api'
import { staggerRows } from '@/lib/gsap'
import {
  ChevronDown, ChevronRight, ExternalLink, X, CheckCircle, AlertTriangle,
  Mail, Phone, Home, Copy, Check, Sparkles, Lock,
} from 'lucide-react'
import { ConfidenceBadge, JurisdictionBadge } from '@/components/ui/trust-badges'
import { StakeholderMap } from '@/components/stakeholder-map'
import { RiskHeatmap } from '@/components/risk-heatmap'
import { PermitTimeline } from '@/components/permit-timeline'
import { cn } from '@/lib/utils'

const IMPACT_LABEL_COLORS: Record<string, string> = {
  'Could delay opening': 'text-risk-high-fg bg-risk-high-bg border-risk-high-border',
  'Could trigger fine':  'text-risk-high-fg bg-risk-high-bg border-risk-high-border',
  'Must verify before lease': 'text-risk-med-fg bg-risk-med-bg border-risk-med-border',
  'Renewal risk': 'text-risk-med-fg bg-risk-med-bg border-risk-med-border',
  'Informational': 'text-risk-low-fg bg-risk-low-bg border-risk-low-border',
}

export default function DashboardPage() {
  const router = useRouter()
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [degraded, setDegraded] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [drawerFinding, setDrawerFinding] = useState<RiskFinding | null>(null)
  const [profileInput, setProfileInput] = useState<string | undefined>(undefined)
  const scoreRef = useRef<HTMLSpanElement>(null)
  const findingsRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const profileJson = sessionStorage.getItem('cl-profile')
        let data: RiskAnalysisResult

        if (profileJson) {
          const profile: BusinessProfile = JSON.parse(profileJson)
          try {
            data = await api.analyzeRisk(profile, controller.signal)
          } catch (err) {
            if ((err as Error).name === 'AbortError') return
            const msg = err instanceof Error ? err.message : ''
            const is503 = msg.startsWith('API 503')
            const isNetwork = !msg.startsWith('API ')
            if (is503 || isNetwork) {
              data = await api.getDemoRisk(controller.signal)
              if (controller.signal.aborted) return
              setDegraded(true)
            } else {
              throw err
            }
          }
        } else {
          data = await api.getDemoRisk(controller.signal)
        }

        if (controller.signal.aborted) return
        setResult(data)
        // Persist full result so checklist/report pages can read without re-fetching
        sessionStorage.setItem('cl-risk-result', JSON.stringify(data))
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Could not load risk analysis. Try the demo scenario or go back to retry.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    const loadTimer = window.setTimeout(() => void load(), 0)
    return () => {
      window.clearTimeout(loadTimer)
      controller.abort()
    }
  }, [])

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

  useEffect(() => {
    if (!result || !findingsRef.current) return
    const rows = findingsRef.current.querySelectorAll('[data-finding-row]')
    if (rows.length) staggerRows(rows)
  }, [result])

  // Read sessionStorage only after mount so SSR and the first client render
  // produce identical markup (avoids the Nav <span> hydration mismatch).
  useEffect(() => {
    setProfileInput(sessionStorage.getItem('cl-input') ?? undefined)
  }, [])

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

      {degraded && (
        <div className="bg-risk-med-bg border-b border-risk-med-border px-6 py-2 flex items-center gap-2 text-caption text-risk-med-fg">
          <AlertTriangle size={13} strokeWidth={1.5} className="shrink-0" />
          Live analysis unavailable — showing cached demo results.
          <button className="ml-auto underline" onClick={() => router.push('/intake')}>Re-analyze</button>
        </div>
      )}

      <main className="flex-1 px-6 py-6 max-w-app mx-auto w-full">
        {loading && <DashboardSkeleton />}

        {error && !loading && (
          <div className="bg-risk-high-bg border border-risk-high-border rounded p-4 text-body text-risk-high-fg">
            {error}
            <div className="mt-3 flex gap-3">
              <button className="text-caption underline" onClick={() => { sessionStorage.removeItem('cl-profile'); window.location.reload() }}>Try demo data</button>
              <button className="text-caption underline" onClick={() => router.push('/intake')}>Go back</button>
            </div>
          </div>
        )}

        {result && !loading && (
          <>
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

            {result.findings.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <CheckCircle size={32} strokeWidth={1.5} className="text-risk-low-fg" />
                <h2 className="text-h2 text-[var(--cl-text)]">No high-risk findings for this profile.</h2>
                <p className="text-body text-[var(--cl-text-secondary)] max-w-sm">
                  We checked all available sources and found nothing requiring immediate action.
                </p>
                <p className="text-caption text-[var(--cl-text-muted)] font-mono">
                  Sources checked: TABC · Austin APH · Dallas Code Compliance · TX Comptroller
                </p>
              </div>
            )}

            {result.findings.length > 0 && (
              <>
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
              <PermitTimeline findings={result.findings} />
              <StakeholderMap findings={result.findings} />
              <RiskHeatmap findings={result.findings} />
              </>
            )}
          </>
        )}
      </main>

      {drawerFinding && (
        <CitationDrawer
          finding={drawerFinding}
          businessDescription={profileInput ?? 'Texas small business'}
          onClose={() => setDrawerFinding(null)}
        />
      )}
    </div>
  )
}

function ImpactLabel({ label }: { label: string }) {
  const classes = IMPACT_LABEL_COLORS[label] ?? 'text-[var(--cl-text-muted)] bg-sunken border-[var(--cl-border)]'
  return (
    <span className={cn('inline-block font-mono text-citation px-2 py-0.5 rounded-sm border whitespace-nowrap', classes)}>
      {label}
    </span>
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
            {(finding.impact_label || finding.is_hidden_requirement) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {finding.impact_label && <ImpactLabel label={finding.impact_label} />}
                {finding.is_hidden_requirement && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-risk-med-border bg-risk-med-bg text-risk-med-fg font-mono text-citation">
                    <Sparkles size={11} strokeWidth={1.5} />
                    Easy to miss
                  </span>
                )}
              </div>
            )}
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
        <div className="px-4 pb-4 border-t border-[var(--cl-border-subtle)] pt-3 space-y-3">
          <p className="text-body text-[var(--cl-text)]">{finding.explanation}</p>
          {finding.prerequisites && finding.prerequisites.length > 0 && (
            <div className="bg-risk-med-bg border border-risk-med-border rounded px-3 py-2">
              <p className="text-caption font-semibold text-risk-med-fg flex items-center gap-1.5 mb-1">
                <Lock size={12} strokeWidth={1.5} />
                Complete these first
              </p>
              <ul className="space-y-0.5">
                {finding.prerequisites.map((p, i) => (
                  <li key={i} className="text-caption text-[var(--cl-text-secondary)] flex items-start gap-1.5">
                    <span className="text-risk-med-fg mt-0.5">→</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-caption text-[var(--cl-text-secondary)]">
            <strong>Next step:</strong> {finding.recommended_action}
          </p>
          {finding.next_steps && finding.next_steps.length > 0 && (
            <ol className="list-decimal list-inside space-y-1">
              {finding.next_steps.map((s, i) => (
                <li key={i} className="text-caption text-[var(--cl-text-secondary)]">{s}</li>
              ))}
            </ol>
          )}
          <div className="flex flex-wrap gap-2 pt-1 items-center">
            <CitationChip url={finding.source_url} onClick={onCitationClick} />
            {finding.confidence_level && <ConfidenceBadge level={finding.confidence_level} />}
            {finding.jurisdiction_level && <JurisdictionBadge level={finding.jurisdiction_level} />}
            <button
              onClick={onCitationClick}
              className="inline-flex items-center gap-1.5 text-caption text-navy-600 border border-[var(--cl-border)] bg-navy-50 hover:bg-navy-100 rounded-sm px-2 py-0.5 transition-colors ml-auto"
            >
              <Mail size={12} strokeWidth={1.5} />
              Draft email
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CitationDrawer({ finding, businessDescription, onClose }: {
  finding: RiskFinding
  businessDescription: string
  onClose: () => void
}) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [draftChannel, setDraftChannel] = useState<'email' | 'call_script' | 'landlord'>('email')
  const [draft, setDraft] = useState<DraftResult | null>(null)
  const [drafting, setDrafting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [draftError, setDraftError] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const el = drawerRef.current
    if (!el) return
    const focusable = Array.from(el.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])'))
    focusable[0]?.focus()
    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [draft]) // re-bind when draft appears (new focusable elements)

  async function handleDraft() {
    setDrafting(true)
    setDraftError('')
    try {
      const result = await api.generateDraft({
        affected_area: finding.affected_area,
        explanation: finding.explanation,
        recommended_action: finding.recommended_action,
        source_url: finding.source_url,
        who_to_contact: finding.who_to_contact,
        what_to_ask: finding.what_to_ask,
        business_description: businessDescription,
        channel: draftChannel,
      })
      setDraft(result)
    } catch {
      setDraftError('Could not generate draft. Please try again.')
    } finally {
      setDrafting(false)
    }
  }

  function handleCopy() {
    if (!draft) return
    const text = draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const CHANNEL_LABELS = { email: 'Email', call_script: 'Call script', landlord: 'Landlord Qs' }
  const CHANNEL_ICONS = { email: <Mail size={13} strokeWidth={1.5} />, call_script: <Phone size={13} strokeWidth={1.5} />, landlord: <Home size={13} strokeWidth={1.5} /> }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Finding detail: ${finding.affected_area}`}
        className="fixed right-0 top-0 h-full w-full max-w-[460px] bg-surface shadow-3 z-50 flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cl-border-subtle)] shrink-0">
          <div className="flex items-center gap-2">
            <RiskBadge level={finding.risk_level} />
            {finding.impact_label && <ImpactLabel label={finding.impact_label} />}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded text-[var(--cl-text-muted)] hover:text-[var(--cl-text)] transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5 flex-1">
          <h2 className="text-h2 text-[var(--cl-text)]">{finding.affected_area}</h2>

          {/* What this means */}
          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">What this means</p>
            <p className="text-body-lg text-[var(--cl-text)]">{finding.explanation}</p>
          </section>

          {/* Action playbook */}
          {(finding.who_to_contact || finding.documents_needed?.length || finding.next_steps?.length) && (
            <section>
              <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">Action playbook</p>
              <div className="space-y-3">
                {finding.who_to_contact && (
                  <div>
                    <p className="text-caption font-semibold text-[var(--cl-text-secondary)] mb-0.5">Who to contact</p>
                    <p className="text-body text-[var(--cl-text)]">{finding.who_to_contact}</p>
                  </div>
                )}
                {finding.what_to_ask && (
                  <div>
                    <p className="text-caption font-semibold text-[var(--cl-text-secondary)] mb-0.5">What to ask</p>
                    <p className="text-body text-[var(--cl-text)]">{finding.what_to_ask}</p>
                  </div>
                )}
                {finding.documents_needed && finding.documents_needed.length > 0 && (
                  <div>
                    <p className="text-caption font-semibold text-[var(--cl-text-secondary)] mb-1">Documents needed</p>
                    <ul className="space-y-0.5">
                      {finding.documents_needed.map((d, i) => (
                        <li key={i} className="text-body text-[var(--cl-text-secondary)] flex items-start gap-1.5">
                          <span className="text-[var(--cl-text-muted)] mt-0.5">·</span>{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {finding.next_steps && finding.next_steps.length > 0 && (
                  <div>
                    <p className="text-caption font-semibold text-[var(--cl-text-secondary)] mb-1">Next steps</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      {finding.next_steps.map((s, i) => (
                        <li key={i} className="text-body text-[var(--cl-text-secondary)]">{s}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Fallback "what to do" */}
          {!finding.who_to_contact && !finding.next_steps?.length && (
            <section>
              <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">What to do</p>
              <p className="text-body text-[var(--cl-text)]">{finding.recommended_action}</p>
            </section>
          )}

          {/* Draft assistant */}
          <section className="border border-[var(--cl-border)] rounded p-4 bg-navy-50">
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">Draft outreach</p>
            <div className="flex gap-1.5 mb-3">
              {(['email', 'call_script', 'landlord'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => { setDraftChannel(ch); setDraft(null) }}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded text-caption border transition-colors duration-[80ms]',
                    draftChannel === ch
                      ? 'bg-navy-600 text-white border-navy-700'
                      : 'bg-surface text-[var(--cl-text-secondary)] border-[var(--cl-border)] hover:bg-white',
                  )}
                >
                  {CHANNEL_ICONS[ch]}
                  {CHANNEL_LABELS[ch]}
                </button>
              ))}
            </div>
            {!draft && (
              <Button size="sm" onClick={handleDraft} loading={drafting}>
                <Mail size={13} strokeWidth={1.5} />
                {drafting ? 'Generating…' : `Generate ${CHANNEL_LABELS[draftChannel]}`}
              </Button>
            )}
            {draftError && <p className="text-caption text-risk-high-fg mt-2">{draftError}</p>}
            {draft && (
              <div className="mt-3 space-y-2">
                {draft.subject && (
                  <p className="text-caption font-mono text-[var(--cl-text-secondary)]">
                    <strong>Subject:</strong> {draft.subject}
                  </p>
                )}
                <pre className="text-caption font-mono text-[var(--cl-text)] bg-surface border border-[var(--cl-border)] rounded p-3 whitespace-pre-wrap overflow-auto max-h-48">
                  {draft.body}
                </pre>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-caption text-navy-600 hover:text-navy-700"
                  >
                    {copied ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setDraft(null)}
                    className="text-caption text-[var(--cl-text-muted)] hover:text-[var(--cl-text)]"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Source */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)]">Source</p>
              {finding.confidence_level && <ConfidenceBadge level={finding.confidence_level} />}
              {finding.jurisdiction_level && <JurisdictionBadge level={finding.jurisdiction_level} />}
            </div>
            {finding.confidence_level === 'low' && (
              <p className="text-caption text-risk-med-fg bg-risk-med-bg border border-risk-med-border rounded px-2 py-1 mb-2">
                Low-confidence finding — verify directly with the agency before taking action.
              </p>
            )}
            <div className="bg-sunken border border-[var(--cl-border)] rounded p-3 font-mono text-citation">
              <p className="text-[var(--cl-text-secondary)] mb-1 break-all">{finding.source_url.replace(/^https?:\/\//, '')}</p>
              <a
                href={finding.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-navy-600 hover:underline"
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
