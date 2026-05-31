import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react'

// Compliance Pulse — static HTML email mock (§6.7)
// Built as real email-like markup so it's a genuine artifact for later.

const UPDATES = [
  {
    level: 'medium' as const,
    title: 'Austin updated outdoor-service hour rules',
    body: 'City of Austin extended permitted outdoor service hours on Friday/Saturday by 1 hour. Review your beer garden permit conditions.',
    link: 'https://www.austintexas.gov/page/zoning',
    agency: 'City of Austin',
  },
  {
    level: 'low' as const,
    title: 'Texas Franchise Tax filing window opens June 15',
    body: 'Annual franchise tax report due May 15. File early to avoid a $50 late-filing penalty.',
    link: 'https://comptroller.texas.gov/taxes/franchise/',
    agency: 'TX Comptroller',
  },
]

const LEVEL_CONFIG = {
  medium: {
    icon: <Clock size={13} strokeWidth={1.5} />,
    label: 'MED',
    classes: 'text-risk-med-fg bg-risk-med-bg border-risk-med-border',
  },
  low: {
    icon: <AlertTriangle size={13} strokeWidth={1.5} />,
    label: 'LOW',
    classes: 'text-risk-low-fg bg-risk-low-bg border-risk-low-border',
  },
}

export default function PulsePage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" />

      <main className="flex-1 px-4 py-8">
        {/* Framing note */}
        <div className="max-w-[640px] mx-auto mb-6">
          <p className="text-caption text-[var(--cl-text-muted)] border border-[var(--cl-border-subtle)] bg-sunken rounded px-3 py-2 font-mono">
            PREVIEW — This is what lands in your inbox every Monday.
          </p>
        </div>

        {/* Email frame */}
        <div className="max-w-[640px] mx-auto bg-surface border border-[var(--cl-border)] rounded shadow-2 overflow-hidden">
          {/* Email header */}
          <div className="bg-navy-900 px-6 py-4">
            <p className="font-semibold text-white text-body-lg">CivicLens</p>
          </div>

          {/* Email meta */}
          <div className="px-6 py-3 bg-sunken border-b border-[var(--cl-border-subtle)] text-caption text-[var(--cl-text-muted)] font-mono">
            <span>from: pulse@civiclens.app</span>
            <span className="mx-3">·</span>
            <span>subj: 2 updates for your Austin restaurant</span>
          </div>

          {/* Email body */}
          <div className="px-6 py-5">
            <p className="text-body-lg text-[var(--cl-text)] mb-5">
              This week we found <strong>2 changes</strong> that affect your Austin restaurant profile.
            </p>

            <div className="space-y-4">
              {UPDATES.map((update, i) => {
                const cfg = LEVEL_CONFIG[update.level]
                return (
                  <div
                    key={i}
                    className="border border-[var(--cl-border)] rounded p-4 flex items-start gap-3"
                  >
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono text-citation shrink-0 mt-0.5 ${cfg.classes}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-semibold text-[var(--cl-text)] mb-1">{update.title}</p>
                      <p className="text-caption text-[var(--cl-text-secondary)] mb-2">{update.body}</p>
                      <a
                        href={update.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-citation font-mono text-navy-600 hover:underline"
                      >
                        View source — {update.agency} <ExternalLink size={11} strokeWidth={1.5} />
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
