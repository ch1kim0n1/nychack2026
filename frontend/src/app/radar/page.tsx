'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { Skeleton } from '@/components/ui/skeleton'
import { api, type BusinessProfile, type RadarThreat } from '@/lib/api'
import { ExternalLink, Radio, AlertTriangle, Clock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

// -- Helpers ------------------------------------------------------------------

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Recency chip: high urgency if checked within 7 days, medium if 8-14, low otherwise */
function RecencyChip({ last_checked_at }: { last_checked_at: string | null }) {
  const days = daysSince(last_checked_at)

  if (days === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono text-citation text-risk-low-fg bg-risk-low-bg border-risk-low-border">
        <Clock size={11} strokeWidth={1.5} />
        Unknown
      </span>
    )
  }

  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono text-citation text-risk-high-fg bg-risk-high-bg border-risk-high-border">
        <AlertTriangle size={11} strokeWidth={1.5} />
        Updated {days === 0 ? 'today' : `${days}d ago`}
      </span>
    )
  }

  if (days <= 14) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono text-citation text-risk-med-fg bg-risk-med-bg border-risk-med-border">
        <Clock size={11} strokeWidth={1.5} />
        Updated {days}d ago
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono text-citation text-risk-low-fg bg-risk-low-bg border-risk-low-border">
      <Clock size={11} strokeWidth={1.5} />
      Updated {days}d ago
    </span>
  )
}

// -- Sub-components -----------------------------------------------------------

function RadarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-surface border border-[var(--cl-border)] rounded p-4">
          <div className="flex items-start justify-between mb-3">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-28 rounded-sm" />
          </div>
          <Skeleton className="h-3 w-40 mb-2" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-5 w-20 rounded-sm" />
            <Skeleton className="h-5 w-24 rounded-sm" />
            <Skeleton className="h-5 w-16 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ThreatCard({ threat }: { threat: RadarThreat }) {
  const days = daysSince(threat.last_checked_at)
  const isHighUrgency = days !== null && days <= 7

  return (
    <div
      className={cn(
        'bg-surface border rounded p-4 transition-colors',
        isHighUrgency
          ? 'border-risk-high-border'
          : 'border-[var(--cl-border)]',
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <h3 className="text-body font-semibold text-[var(--cl-text)] flex-1 min-w-0">
          {threat.title}
        </h3>
        <RecencyChip last_checked_at={threat.last_checked_at} />
      </div>

      {/* Agency + jurisdiction */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-caption text-[var(--cl-text-secondary)] font-mono">
          {threat.agency}
        </span>
        <span className="text-caption text-[var(--cl-text-muted)]">·</span>
        <span className="text-caption text-[var(--cl-text-muted)]">{threat.jurisdiction}</span>
        <span className="text-caption text-[var(--cl-text-muted)]">·</span>
        <span className="text-caption text-[var(--cl-text-muted)]">
          Checked {formatDate(threat.last_checked_at)}
        </span>
      </div>

      {/* Matched tags */}
      {threat.matched_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {threat.matched_tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 rounded-sm border font-mono text-citation text-[var(--cl-text-secondary)] bg-sunken border-[var(--cl-border-subtle)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Source link */}
      <a
        href={threat.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-citation font-mono text-navy-600 hover:underline"
      >
        View source <ExternalLink size={11} strokeWidth={1.5} />
      </a>
    </div>
  )
}

// -- Page ---------------------------------------------------------------------

export default function RadarPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [threats, setThreats] = useState<RadarThreat[] | null>(null)
  const [profileSummary, setProfileSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const json = sessionStorage.getItem('cl-profile')
    if (!json) {
      setLoading(false)
      return
    }

    let parsed: BusinessProfile
    try {
      parsed = JSON.parse(json) as BusinessProfile
    } catch {
      setLoading(false)
      return
    }

    setProfile(parsed)

    void api
      .radarThreats(parsed, 30)
      .then((res) => {
        setThreats(res.threats)
        setProfileSummary(res.profile_summary)
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Could not load radar data.',
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" />
      <DisclaimerBanner />

      <main className="flex-1 px-4 py-8 max-w-[900px] mx-auto w-full">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <Radio size={20} strokeWidth={1.5} className="text-navy-600 shrink-0" />
          <div>
            <h1 className="text-body-lg font-semibold text-[var(--cl-text)]">
              Regulatory Threat Radar
            </h1>
            {profileSummary && (
              <p className="text-caption text-[var(--cl-text-muted)] font-mono mt-0.5">
                {profileSummary}
              </p>
            )}
          </div>
        </div>

        {/* No profile — prompt to run intake */}
        {!loading && !profile && (
          <div className="bg-surface border border-[var(--cl-border)] rounded p-8 text-center">
            <ShieldCheck
              size={32}
              strokeWidth={1.5}
              className="mx-auto mb-3 text-[var(--cl-text-muted)]"
            />
            <p className="text-body font-semibold text-[var(--cl-text)] mb-2">
              No business profile found
            </p>
            <p className="text-caption text-[var(--cl-text-secondary)] mb-4">
              Run an intake scan first so the radar can match regulatory updates to your
              business.
            </p>
            <Link
              href="/intake"
              className="inline-block text-caption font-semibold px-4 py-2 rounded bg-navy-600 text-white hover:bg-navy-700 transition-colors"
            >
              Start intake scan
            </Link>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <RadarSkeleton />}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-surface border border-risk-high-border rounded p-4 text-caption text-risk-high-fg">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && !error && threats !== null && (
          <>
            {/* Summary bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <p className="text-caption text-[var(--cl-text-muted)] font-mono">
                {threats.length === 0
                  ? 'No matches in the last 30 days'
                  : `${threats.length} source${threats.length === 1 ? '' : 's'} matched — last 30 days`}
              </p>
            </div>

            {/* Empty state */}
            {threats.length === 0 && (
              <div className="bg-surface border border-[var(--cl-border)] rounded p-8 text-center">
                <ShieldCheck
                  size={32}
                  strokeWidth={1.5}
                  className="mx-auto mb-3 text-risk-low-fg"
                />
                <p className="text-body font-semibold text-[var(--cl-text)] mb-1">
                  All clear
                </p>
                <p className="text-caption text-[var(--cl-text-secondary)]">
                  No recent regulatory updates matched your profile in the last 30 days.
                </p>
              </div>
            )}

            {/* Threat cards */}
            {threats.length > 0 && (
              <div className="space-y-3">
                {threats.map((threat) => (
                  <ThreatCard key={threat.source_id} threat={threat} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
