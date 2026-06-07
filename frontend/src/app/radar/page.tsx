'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { Skeleton } from '@/components/ui/skeleton'
import { api, type BusinessProfile, type RadarThreat } from '@/lib/api'
import { ExternalLink, Radio, AlertTriangle, Clock, ShieldCheck, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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

function RecencyChip({ last_checked_at }: { last_checked_at: string | null }) {
  const days = daysSince(last_checked_at)

  if (days === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-risk-low-border bg-risk-low-bg px-2 py-0.5 font-mono text-citation text-risk-low-fg">
        <Clock size={11} strokeWidth={1.5} />
        Unknown
      </span>
    )
  }

  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-risk-high-border bg-risk-high-bg px-2 py-0.5 font-mono text-citation text-risk-high-fg">
        <AlertTriangle size={11} strokeWidth={1.5} />
        Updated {days === 0 ? 'today' : `${days}d ago`}
      </span>
    )
  }

  if (days <= 14) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-risk-med-border bg-risk-med-bg px-2 py-0.5 font-mono text-citation text-risk-med-fg">
        <Clock size={11} strokeWidth={1.5} />
        Updated {days}d ago
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-risk-low-border bg-risk-low-bg px-2 py-0.5 font-mono text-citation text-risk-low-fg">
      <Clock size={11} strokeWidth={1.5} />
      Updated {days}d ago
    </span>
  )
}

function RadarSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--cl-border)] bg-surface p-5 shadow-1 animate-pulse">
      <Skeleton className="mb-5 h-8 w-72" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="grid gap-3 border-t border-[var(--cl-border-subtle)] py-4 md:grid-cols-[1fr_160px_130px]">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  )
}

function ThreatRow({ threat }: { threat: RadarThreat }) {
  const days = daysSince(threat.last_checked_at)
  const isHighUrgency = days !== null && days <= 7

  return (
    <div className={cn(
      'grid gap-3 border-t border-[var(--cl-border-subtle)] px-4 py-4 md:grid-cols-[1fr_180px_132px] md:items-center',
      isHighUrgency && 'bg-risk-high-bg/40',
    )}>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="text-body font-semibold text-[var(--cl-text)]">{threat.title}</h3>
          {threat.matched_tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-sm border border-[var(--cl-border-subtle)] bg-sunken px-2 py-0.5 font-mono text-citation text-[var(--cl-text-secondary)]">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-caption text-[var(--cl-text-muted)]">
          {threat.agency} · {threat.jurisdiction} · Checked {formatDate(threat.last_checked_at)}
        </p>
      </div>
      <RecencyChip last_checked_at={threat.last_checked_at} />
      <a
        href={threat.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-mono text-citation text-navy-600 hover:underline md:justify-end"
      >
        View source <ExternalLink size={11} strokeWidth={1.5} />
      </a>
    </div>
  )
}

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
        setError(err instanceof Error ? err.message : 'Could not load radar data.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" />
      <DisclaimerBanner />

      <main className="flex-1 px-6 py-8 max-w-app mx-auto w-full">
        <div className="mb-6 overflow-hidden rounded-lg border border-[var(--cl-border)] bg-surface shadow-1">
          <div className="grid lg:grid-cols-[280px_1fr]">
            <div className="bg-navy-900 px-6 py-5 text-white">
              <div className="mb-4 flex items-center gap-2 text-white/75">
                <Radio size={18} strokeWidth={1.5} />
                <span className="text-label uppercase tracking-[0.06em]">Regulatory radar</span>
              </div>
              <p className="text-h1 text-white">Policy changes matched to your profile.</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">Monitoring scope</p>
              <p className="text-body-lg text-[var(--cl-text)]">
                {profileSummary || 'Run an intake scan to match local updates against your business context.'}
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="border-l-2 border-navy-600 pl-3">
                  <p className="font-mono text-h2 text-[var(--cl-text)]">{threats?.length ?? 0}</p>
                  <p className="text-caption text-[var(--cl-text-muted)]">Matched sources</p>
                </div>
                <div className="border-l-2 border-risk-high-border pl-3">
                  <p className="font-mono text-h2 text-[var(--cl-text)]">{threats?.filter((threat) => (daysSince(threat.last_checked_at) ?? 99) <= 7).length ?? 0}</p>
                  <p className="text-caption text-[var(--cl-text-muted)]">Updated this week</p>
                </div>
                <div className="border-l-2 border-[var(--cl-border-strong)] pl-3">
                  <p className="font-mono text-h2 text-[var(--cl-text)]">30d</p>
                  <p className="text-caption text-[var(--cl-text-muted)]">Monitoring window</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!loading && !profile && (
          <div className="rounded-lg border border-[var(--cl-border)] bg-surface p-8 text-center shadow-1">
            <Building2 size={32} strokeWidth={1.5} className="mx-auto mb-3 text-[var(--cl-text-muted)]" />
            <p className="text-body font-semibold text-[var(--cl-text)] mb-2">No business profile found</p>
            <p className="text-caption text-[var(--cl-text-secondary)] mb-4">
              Run an intake scan first so the radar can match regulatory updates to your business.
            </p>
            <Link href="/intake" className="inline-block rounded bg-navy-600 px-4 py-2 text-caption font-semibold text-white transition-colors hover:bg-navy-700">
              Start intake scan
            </Link>
          </div>
        )}

        {loading && <RadarSkeleton />}

        {!loading && error && (
          <div className="rounded border border-risk-high-border bg-surface p-4 text-caption text-risk-high-fg">
            {error}
          </div>
        )}

        {!loading && !error && threats !== null && (
          <section className="overflow-hidden rounded-lg border border-[var(--cl-border)] bg-surface shadow-1">
            <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Source activity</p>
                <h2 className="text-h2 text-[var(--cl-text)]">
                  {threats.length === 0 ? 'No matched updates in the last 30 days' : `${threats.length} matched source${threats.length === 1 ? '' : 's'}`}
                </h2>
              </div>
              <ShieldCheck size={20} strokeWidth={1.5} className="text-risk-low-fg" />
            </div>

            {threats.length === 0 ? (
              <div className="border-t border-[var(--cl-border-subtle)] px-5 py-10 text-center">
                <ShieldCheck size={32} strokeWidth={1.5} className="mx-auto mb-3 text-risk-low-fg" />
                <p className="text-body font-semibold text-[var(--cl-text)] mb-1">All clear</p>
                <p className="text-caption text-[var(--cl-text-secondary)]">
                  No recent regulatory updates matched your profile in the last 30 days.
                </p>
              </div>
            ) : (
              <div>
                {threats.map((threat) => (
                  <ThreatRow key={threat.source_id} threat={threat} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
