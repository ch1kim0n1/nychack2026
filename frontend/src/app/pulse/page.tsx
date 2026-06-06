'use client'

import { useEffect, useState } from 'react'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { type RiskAnalysisResult, type RiskFinding } from '@/lib/api'
import { AlertTriangle, Clock, Info, ExternalLink } from 'lucide-react'

// Compliance Pulse 2.0 — personalized weekly digest built from the user's own findings (8.5).
// Falls back to a static demo digest when no analysis is in the session.

interface DigestItem {
  level: 'high' | 'medium' | 'low'
  title: string
  body: string
  link: string
  agency: string
}

const STATIC_DIGEST: DigestItem[] = [
  {
    level: 'medium',
    title: 'Austin updated outdoor-service hour rules',
    body: 'City of Austin extended permitted outdoor service hours on Friday/Saturday by 1 hour. Review your beer garden permit conditions.',
    link: 'https://www.austintexas.gov/development-services/zoning-verification',
    agency: 'City of Austin',
  },
  {
    level: 'low',
    title: 'Texas Franchise Tax filing window opens June 15',
    body: 'Annual franchise tax report due May 15. File early to avoid a $50 late-filing penalty.',
    link: 'https://comptroller.texas.gov/taxes/sales/',
    agency: 'TX Comptroller',
  },
]

const LEVEL_CONFIG = {
  high:   { icon: <AlertTriangle size={13} strokeWidth={1.5} />, label: 'HIGH', classes: 'text-risk-high-fg bg-risk-high-bg border-risk-high-border' },
  medium: { icon: <Clock size={13} strokeWidth={1.5} />,        label: 'MED',  classes: 'text-risk-med-fg bg-risk-med-bg border-risk-med-border' },
  low:    { icon: <Info size={13} strokeWidth={1.5} />,         label: 'LOW',  classes: 'text-risk-low-fg bg-risk-low-bg border-risk-low-border' },
}

function buildPersonalDigest(result: RiskAnalysisResult): DigestItem[] {
  // Surface the top 3 actionable findings as "this week's" digest items
  return result.findings
    .filter(f => f.urgency === 'immediate' || f.urgency === 'soon' || f.risk_level === 'high')
    .slice(0, 3)
    .map((f: RiskFinding) => ({
      level: f.risk_level,
      title: f.effective_date
        ? `${f.affected_area} — due ${f.effective_date}`
        : `${f.affected_area} needs attention`,
      body: f.impact_label
        ? `${f.impact_label}. ${f.recommended_action}`
        : f.recommended_action,
      link: f.source_url,
      agency: f.who_to_contact ?? 'Agency',
    }))
}

export default function PulsePage() {
  const [digest, setDigest] = useState<DigestItem[]>(STATIC_DIGEST)
  const [personalized, setPersonalized] = useState(false)
  const [businessName, setBusinessName] = useState('your Austin restaurant')

  useEffect(() => {
    const json = sessionStorage.getItem('cl-risk-result')
    const input = sessionStorage.getItem('cl-input')
    if (json) {
      try {
        const result: RiskAnalysisResult = JSON.parse(json)
        const items = buildPersonalDigest(result)
        if (items.length > 0) {
          setDigest(items)
          setPersonalized(true)
        }
      } catch { /* keep static */ }
    }
    if (input) setBusinessName(input.length > 40 ? input.slice(0, 40) + '…' : input)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" />

      <main className="flex-1 px-4 py-8">
        <div className="max-w-[640px] mx-auto mb-6">
          <p className="text-caption text-[var(--cl-text-muted)] border border-[var(--cl-border-subtle)] bg-sunken rounded px-3 py-2 font-mono">
            {personalized
              ? 'PREVIEW — Personalized from your scan. This is what lands in your inbox every Monday.'
              : 'PREVIEW — This is what lands in your inbox every Monday.'}
          </p>
        </div>

        <div className="max-w-[640px] mx-auto bg-surface border border-[var(--cl-border)] rounded shadow-2 overflow-hidden">
          <div className="bg-navy-900 px-6 py-4">
            <p className="font-semibold text-white text-body-lg">CivicLens</p>
          </div>

          <div className="px-6 py-3 bg-sunken border-b border-[var(--cl-border-subtle)] text-caption text-[var(--cl-text-muted)] font-mono">
            <span>from: pulse@civiclens.app</span>
            <span className="mx-3">·</span>
            <span>subj: {digest.length} update{digest.length === 1 ? '' : 's'} for your business</span>
          </div>

          <div className="px-6 py-5">
            <p className="text-body-lg text-[var(--cl-text)] mb-5">
              This week we found <strong>{digest.length} item{digest.length === 1 ? '' : 's'}</strong> that
              {personalized ? ' affect your compliance plan' : ' affect your Austin restaurant profile'}.
            </p>

            <div className="space-y-4">
              {digest.map((item, i) => {
                const cfg = LEVEL_CONFIG[item.level]
                return (
                  <div key={i} className="border border-[var(--cl-border)] rounded p-4 flex items-start gap-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono text-citation shrink-0 mt-0.5 ${cfg.classes}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-semibold text-[var(--cl-text)] mb-1">{item.title}</p>
                      <p className="text-caption text-[var(--cl-text-secondary)] mb-2">{item.body}</p>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-citation font-mono text-navy-600 hover:underline"
                      >
                        View source — {item.agency} <ExternalLink size={11} strokeWidth={1.5} />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--cl-border-subtle)] text-caption text-[var(--cl-text-muted)] flex items-center justify-between flex-wrap gap-2">
              <span>Informational guidance, not legal advice.</span>
              <a href="#" className="hover:underline">Unsubscribe</a>
            </div>
          </div>
        </div>

        <DisclaimerBanner className="max-w-[640px] mx-auto mt-4 rounded border border-[var(--cl-border-subtle)]" />
      </main>
    </div>
  )
}
