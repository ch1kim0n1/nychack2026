'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { type RiskAnalysisResult, type RiskFinding, type PulseDigest, api } from '@/lib/api'
import { AlertTriangle, Clock, Info, ExternalLink } from 'lucide-react'

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
    body: 'City of Austin extended permitted outdoor service hours on Friday and Saturday by 1 hour. Review your beer garden permit conditions.',
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
  high: { icon: <AlertTriangle size={13} strokeWidth={1.5} />, label: 'HIGH', classes: 'text-risk-high-fg bg-risk-high-bg border-risk-high-border' },
  medium: { icon: <Clock size={13} strokeWidth={1.5} />, label: 'MED', classes: 'text-risk-med-fg bg-risk-med-bg border-risk-med-border' },
  low: { icon: <Info size={13} strokeWidth={1.5} />, label: 'LOW', classes: 'text-risk-low-fg bg-risk-low-bg border-risk-low-border' },
}

function buildPersonalDigest(result: RiskAnalysisResult): DigestItem[] {
  return result.findings
    .filter((finding) => finding.urgency === 'immediate' || finding.urgency === 'soon' || finding.risk_level === 'high')
    .slice(0, 3)
    .map((finding: RiskFinding) => ({
      level: finding.risk_level,
      title: finding.effective_date
        ? `${finding.affected_area}: due ${finding.effective_date}`
        : `${finding.affected_area} needs attention`,
      body: finding.impact_label
        ? `${finding.impact_label}. ${finding.recommended_action}`
        : finding.recommended_action,
      link: finding.source_url,
      agency: finding.who_to_contact ?? 'Agency',
    }))
}

export default function PulsePage() {
  const [digest, setDigest] = useState<DigestItem[]>(STATIC_DIGEST)
  const [personalized, setPersonalized] = useState(false)
  const [apiPersonalized, setApiPersonalized] = useState(false)
  const [businessName, setBusinessName] = useState('your Austin restaurant')

  useEffect(() => {
    const json = sessionStorage.getItem('cl-risk-result')
    const input = sessionStorage.getItem('cl-input')
    const profileJson = sessionStorage.getItem('cl-profile')

    if (json) {
      try {
        const result: RiskAnalysisResult = JSON.parse(json)
        const items = buildPersonalDigest(result)
        if (items.length > 0) {
          setDigest(items)
          setPersonalized(true)
        }
      } catch {
        // Keep static digest when stored data is malformed.
      }
    }
    if (input) setBusinessName(input.length > 40 ? `${input.slice(0, 40)}...` : input)

    if (profileJson) {
      try {
        const profile = JSON.parse(profileJson) as Parameters<typeof api.getPulseDigest>[0]
        api.getPulseDigest(profile)
          .then((apiDigest: PulseDigest) => {
            if (apiDigest.personalized && apiDigest.items.length > 0) {
              setDigest(apiDigest.items)
              setPersonalized(true)
              setApiPersonalized(true)
              if (apiDigest.business_label) {
                setBusinessName(
                  apiDigest.business_label.length > 40
                    ? `${apiDigest.business_label.slice(0, 40)}...`
                    : apiDigest.business_label,
                )
              }
            }
          })
          .catch(() => {
            // Keep sessionStorage or static digest on error.
          })
      } catch {
        // Keep existing digest if profile parse fails.
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" />

      <main className="flex-1 px-4 py-8">
        <div className="max-w-[760px] mx-auto mb-6">
          <p className="text-caption text-[var(--cl-text-muted)] border border-[var(--cl-border-subtle)] bg-surface rounded px-3 py-2 font-mono">
            {apiPersonalized
              ? 'LIVE: Personalized from your scan.'
              : personalized
                ? "PREVIEW: Personalized from your scan. This shows what a weekly digest would look like."
                : 'PREVIEW: This shows what a weekly digest would look like.'}
          </p>
        </div>

        <div className="max-w-[760px] mx-auto bg-surface border border-[var(--cl-border)] rounded-lg shadow-2 overflow-hidden">
          <div className="bg-navy-900 px-6 py-5">
            <p className="font-semibold text-white text-body-lg">CivicLens Pulse</p>
            <p className="mt-1 text-caption text-white/60">Weekly civic intelligence for {businessName}</p>
          </div>

          <div className="px-6 py-3 bg-sunken border-b border-[var(--cl-border-subtle)] text-caption text-[var(--cl-text-muted)] font-mono">
            <span>email delivery: not connected yet</span>
            <span className="mx-3">·</span>
            <span>subj: {digest.length} update{digest.length === 1 ? '' : 's'} for your business</span>
          </div>

          <div className="px-6 py-5">
            <p className="text-body-lg text-[var(--cl-text)] mb-5">
              This week we found <strong>{digest.length} item{digest.length === 1 ? '' : 's'}</strong> that
              {personalized ? ' affect your compliance plan' : ' affect your Austin restaurant profile'}.
            </p>

            <div className="overflow-hidden rounded border border-[var(--cl-border-subtle)]">
              {digest.map((item, i) => {
                const cfg = LEVEL_CONFIG[item.level]
                return (
                  <div key={i} className="flex items-start gap-3 border-b border-[var(--cl-border-subtle)] p-4 last:border-b-0">
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
                        View source: {item.agency} <ExternalLink size={11} strokeWidth={1.5} />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--cl-border-subtle)] text-caption text-[var(--cl-text-muted)] flex items-center justify-between flex-wrap gap-2">
              <span>Informational guidance, not legal advice.</span>
              <Link href="/contact" className="text-navy-600 hover:underline">
                Get notified when weekly digest launches
              </Link>
            </div>
          </div>
        </div>

        <DisclaimerBanner className="max-w-[760px] mx-auto mt-4 rounded border border-[var(--cl-border-subtle)]" />
      </main>
    </div>
  )
}
