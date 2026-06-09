'use client'

import Link from 'next/link'
import { Nav } from '@/components/nav'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Tier {
  name: string
  price: string
  period?: string
  tagline: string
  features: string[]
  cta: string
  ctaHref: string
  featured?: boolean
  badge?: string
}

const TIERS: Tier[] = [
  {
    name: 'Free Scan',
    price: '$0',
    tagline: 'One compliance scan with full citations.',
    features: [
      'One business profile',
      'Full risk dashboard with citations',
      'Action playbook per finding',
      'City-to-city diff viewer',
      'Print / export report',
    ],
    cta: 'Run a free scan',
    ctaHref: '/intake',
  },
  {
    name: 'Pro / Monitoring',
    price: 'Coming soon',
    tagline: 'Monitoring features are in pilot, not available for purchase yet.',
    features: [
      'Everything in Free',
      'Planned saved business profiles',
      'Weekly Compliance Pulse preview',
      'Planned deadline & renewal reminders',
      'Planned rule-change alerts for your profile',
      'Unlimited scans',
    ],
    cta: 'Join waitlist',
    ctaHref: '/contact',
    featured: true,
    badge: 'Pilot roadmap',
  },
  {
    name: 'Multi-Location',
    price: 'Waitlist',
    tagline: 'For franchises, chains, and multi-city operators once team plans launch.',
    features: [
      'Everything in Pro',
      'Unlimited locations & profiles',
      'Cross-location diff comparison',
      'Team access',
      'Priority support',
    ],
    cta: 'Contact sales',
    ctaHref: '/contact',
  },
]

const ONE_TIME = {
  name: 'Expansion Report',
  price: 'Preview',
  tagline: 'City-to-city or new-service expansion report preview. Payment is not connected yet.',
}

const CHANNELS = [
  { name: 'Restaurant associations', detail: 'Member benefit / channel partner' },
  { name: 'Chambers of Commerce', detail: 'White-label / co-branded portal' },
  { name: 'SBDCs', detail: 'Advisor tool for entrepreneurs' },
  { name: 'Accountants & bookkeepers', detail: 'Generate client compliance reports' },
  { name: 'Permit consultants', detail: 'Pro tier for faster research' },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="marketing" />

      <main className="flex-1 px-6 py-12 max-w-marketing mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">Pricing</p>
          <h1 className="text-h1 text-[var(--cl-text)] mb-2">Free scan now. Paid monitoring is coming soon.</h1>
          <p className="text-body-lg text-[var(--cl-text-secondary)] max-w-lg mx-auto">
            Run your first risk scan for free. Monitoring, reminders, and paid reports are roadmap previews while payment and account flows are being built.
          </p>
        </div>

        <div className="mb-6 rounded border border-risk-med-border bg-risk-med-bg px-4 py-3 text-body text-risk-med-fg">
          Paid tiers are not purchasable yet. Use the free scan today or join the waitlist for monitoring pilots.
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {TIERS.map(tier => (
            <div
              key={tier.name}
              className={cn(
                'flex flex-col rounded border p-6 bg-surface',
                tier.featured
                  ? 'border-navy-600 shadow-2 ring-1 ring-navy-600'
                  : 'border-[var(--cl-border)] shadow-1',
              )}
            >
              {tier.featured && (
                <span className="self-start mb-3 px-2 py-0.5 rounded-sm bg-navy-600 text-white font-mono text-citation uppercase tracking-wide">
                  {tier.badge ?? 'Featured'}
                </span>
              )}
              <h2 className="text-h3 text-[var(--cl-text)]">{tier.name}</h2>
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-display font-semibold text-[var(--cl-text)] font-mono">{tier.price}</span>
                {tier.period && <span className="text-body text-[var(--cl-text-muted)]">{tier.period}</span>}
              </div>
              <p className="text-caption text-[var(--cl-text-secondary)] mb-5">{tier.tagline}</p>
              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-body text-[var(--cl-text-secondary)]">
                    <Check size={15} strokeWidth={2} className="text-risk-low-fg shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={tier.ctaHref}>
                <Button variant={tier.featured ? 'primary' : 'secondary'} size="md" className="w-full">
                  {tier.cta} <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* One-time report strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-navy-50 border border-[var(--cl-border)] rounded p-5 mb-12">
          <div>
            <p className="text-h3 text-[var(--cl-text)]">{ONE_TIME.name}: <span className="font-mono">{ONE_TIME.price}</span></p>
            <p className="text-caption text-[var(--cl-text-secondary)]">{ONE_TIME.tagline}</p>
          </div>
          <Link href="/scenarios">
            <Button variant="secondary" size="md">Build an expansion report</Button>
          </Link>
        </div>

        {/* Channels / partnerships */}
        <div className="border-t border-[var(--cl-border-subtle)] pt-8">
          <h2 className="text-h2 text-[var(--cl-text)] mb-2">For partners</h2>
          <p className="text-body text-[var(--cl-text-secondary)] mb-5 max-w-lg">
            We reach small businesses through the organizations they already trust.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CHANNELS.map(c => (
              <div key={c.name} className="border border-[var(--cl-border)] rounded p-4 bg-surface">
                <p className="text-body font-semibold text-[var(--cl-text)]">{c.name}</p>
                <p className="text-caption text-[var(--cl-text-muted)] mt-0.5">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-caption text-[var(--cl-text-muted)] mt-10 text-center">
          Informational guidance, not legal advice. Paid plans are roadmap previews and are not available for purchase in this demo.
        </p>
      </main>
    </div>
  )
}
