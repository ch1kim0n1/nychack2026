'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle,
  FileCheck2,
  FileText,
  Gavel,
  Map,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { Button } from '@/components/ui/button'
import { heroEntrance, initGsap, scrollReveal } from '@/lib/gsap'

const SOURCES = [
  'Texas.gov',
  'TABC',
  'City of Austin',
  'City of Dallas',
  'TX Comptroller',
  'TX Legislature',
]

const WORKFLOW = [
  {
    icon: <FileText size={20} strokeWidth={1.5} />,
    title: 'Profile the business',
    body: 'Location, industry, lease posture, staffing, and expansion plans become one civic operating context.',
  },
  {
    icon: <Search size={20} strokeWidth={1.5} />,
    title: 'Map the rule stack',
    body: 'CivicLens reads city, county, state, and agency sources and ties them to the activities that matter.',
  },
  {
    icon: <CheckCircle size={20} strokeWidth={1.5} />,
    title: 'Move with confidence',
    body: 'Findings become an action plan with deadlines, documents, contacts, and policy monitoring.',
  },
]

const FEATURE_STRIPS = [
  {
    icon: <Building2 size={18} strokeWidth={1.5} />,
    title: 'Jurisdiction mapping',
    body: 'Local, county, state, and agency layers in one view.',
  },
  {
    icon: <Gavel size={18} strokeWidth={1.5} />,
    title: 'Change radar',
    body: 'Recent rule shifts matched to the business profile.',
  },
  {
    icon: <FileCheck2 size={18} strokeWidth={1.5} />,
    title: 'Cited findings',
    body: 'The source stays attached to every material point.',
  },
  {
    icon: <Route size={18} strokeWidth={1.5} />,
    title: 'Action sequencing',
    body: 'Blocking requirements organized in opening order.',
  },
  {
    icon: <Map size={18} strokeWidth={1.5} />,
    title: 'Location sensitivity',
    body: 'Rules flex by city and operating context, not just keywords.',
  },
  {
    icon: <Bell size={18} strokeWidth={1.5} />,
    title: 'Watchlists',
    body: 'Saved profiles can be monitored as source pages change.',
  },
]

const HERO_FINDINGS = [
  { source: 'TABC', title: 'Mixed beverage permit dependency', level: 'High', note: 'Confirm local approval path and seller-server timing.' },
  { source: 'Austin Code', title: 'Outdoor service condition', level: 'Medium', note: 'Verify patio hours and occupancy before lease signoff.' },
  { source: 'TX Comptroller', title: 'Tax registration follow-through', level: 'Low', note: 'Prepare sales tax and franchise account setup.' },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const workflowRef = useRef<HTMLDivElement>(null)
  const featureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initGsap()
    if (heroRef.current) heroEntrance(heroRef.current)
    if (workflowRef.current) scrollReveal(workflowRef.current)
    if (featureRef.current) scrollReveal(featureRef.current)
  }, [])

  return (
    <div className="min-h-full bg-canvas text-[var(--cl-text)]">
      <Nav variant="marketing" />

      <section className="cl-shell-grid relative overflow-hidden border-b border-[var(--cl-border-subtle)]">
        <div className="relative mx-auto max-w-marketing px-6 pb-14 pt-14 sm:px-8 lg:pb-20 lg:pt-20">
          <div ref={heroRef} className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
            <div>
              <div data-hero className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--cl-border)] bg-white/70 px-3 py-1 text-[12px] uppercase tracking-[0.18em] text-navy-700 shadow-1">
                <Sparkles size={12} strokeWidth={1.5} />
                Civic intelligence for local operators
              </div>
              <h1 data-hero className="max-w-[11ch] text-[3.25rem] font-bold leading-[0.96] tracking-[-0.05em] text-[var(--cl-text)] sm:text-[4.4rem]">
                Know the civic moves before they become expensive.
              </h1>
              <p data-hero className="mt-6 max-w-xl text-body-lg text-[var(--cl-text-secondary)]">
                CivicLens turns fragmented city, state, and agency requirements into a sharp operating picture with cited findings, deadlines, action paths, and policy watchlists.
              </p>
              <div data-hero className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/intake">
                  <Button size="lg">
                    Run a free risk scan
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="secondary" size="lg">
                    Open the demo route
                  </Button>
                </Link>
              </div>
              <div data-hero className="mt-9 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ['4', 'jurisdiction layers'],
                  ['30d', 'radar window'],
                  ['100%', 'cited findings'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-[var(--cl-border)] bg-white/70 px-4 py-4 shadow-1">
                    <p className="font-mono text-[2rem] leading-none text-[var(--cl-text)]">{value}</p>
                    <p className="mt-2 text-caption uppercase tracking-[0.1em] text-[var(--cl-text-muted)]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div data-hero className="cl-hero-panel rounded-[28px] p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
                <div className="rounded-[24px] bg-navy-900 px-5 py-5 text-white shadow-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-citation uppercase tracking-[0.18em] text-white/55">Austin launch profile</p>
                      <p className="mt-2 text-h3 text-white">Restaurant with patio and alcohol service</p>
                    </div>
                    <ShieldCheck size={20} strokeWidth={1.5} className="text-white/75" />
                  </div>
                  <div className="mt-8 rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="text-label text-white/55">Risk score</p>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="font-mono text-[3rem] leading-none text-[#f2c46b]">68</span>
                      <span className="pb-1 text-caption text-white/55">/ 100</span>
                    </div>
                    <p className="mt-4 text-caption text-white/70">
                      Lease timing, TABC dependency, and outdoor-service conditions cluster at the top of the opening plan.
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {['Lease issue before signing', 'Agency approval dependency', 'Outdoor seating condition'].map((item, index) => (
                      <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-caption text-white/78">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 font-mono text-citation text-white/60">
                          0{index + 1}
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--cl-border-subtle)] bg-white/80 p-4 shadow-1">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-label text-[var(--cl-text-muted)]">Live intelligence view</p>
                      <p className="mt-1 text-body font-semibold text-[var(--cl-text)]">Priority findings and next moves</p>
                    </div>
                    <span className="rounded-full border border-[var(--cl-border)] bg-[var(--cl-sunken)] px-3 py-1 font-mono text-citation text-[var(--cl-text-secondary)]">
                      3 active checks
                    </span>
                  </div>
                  <div className="space-y-3">
                    {HERO_FINDINGS.map(item => (
                      <div key={item.title} className="rounded-[20px] border border-[var(--cl-border-subtle)] bg-surface px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-citation uppercase tracking-[0.12em] text-[var(--cl-text-muted)]">{item.source}</p>
                            <p className="mt-1 text-body font-semibold text-[var(--cl-text)]">{item.title}</p>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-1 font-mono text-citation ${
                              item.level === 'High'
                                ? 'border-risk-high-border bg-risk-high-bg text-risk-high-fg'
                                : item.level === 'Medium'
                                  ? 'border-risk-med-border bg-risk-med-bg text-risk-med-fg'
                                  : 'border-risk-low-border bg-risk-low-bg text-risk-low-fg'
                            }`}
                          >
                            {item.level}
                          </span>
                        </div>
                        <p className="mt-2 text-caption text-[var(--cl-text-secondary)]">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sources" className="border-b border-[var(--cl-border-subtle)] bg-white/45 px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-marketing flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <span className="shrink-0 text-label text-[var(--cl-text-muted)]">Sources in the loop</span>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map(source => (
              <span key={source} className="rounded-full border border-[var(--cl-border)] bg-white/70 px-3 py-1 font-mono text-citation text-[var(--cl-text-secondary)] shadow-1">
                {source}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-marketing px-6 py-16 sm:px-8 lg:py-20">
        <div ref={workflowRef} className="grid items-start gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-14">
          <div>
            <p className="text-label text-navy-600">From rule search to operating plan</p>
            <h2 className="mt-3 max-w-[12ch] text-[2.6rem] font-bold leading-[1.02] tracking-[-0.04em] text-[var(--cl-text)]">
              A cleaner workflow for local compliance.
            </h2>
            <p className="mt-4 max-w-lg text-body-lg text-[var(--cl-text-secondary)]">
              The product is shaped around the way civic rules actually stack: overlapping jurisdictions, agency guidance, permit dependencies, effective dates, and business impact.
            </p>
          </div>
          <div className="space-y-4">
            {WORKFLOW.map((step, index) => (
              <div key={step.title} className="cl-glow-card rounded-[24px] border border-[var(--cl-border)] bg-white/75 p-5 shadow-1">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-1">
                    {step.icon}
                  </div>
                  <div>
                    <p className="font-mono text-citation uppercase tracking-[0.14em] text-[var(--cl-text-muted)]">0{index + 1}</p>
                    <h3 className="mt-1 text-h3 text-[var(--cl-text)]">{step.title}</h3>
                    <p className="mt-2 text-body text-[var(--cl-text-secondary)]">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--cl-border-subtle)] bg-white/55 px-6 py-16 sm:px-8 lg:py-20">
        <div ref={featureRef} className="mx-auto grid max-w-marketing gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-label text-navy-600">Built for real civic risk</p>
            <h2 className="mt-3 max-w-[11ch] text-[2.6rem] font-bold leading-[1.02] tracking-[-0.04em] text-[var(--cl-text)]">
              Not another generic checklist.
            </h2>
            <p className="mt-4 max-w-lg text-body-lg text-[var(--cl-text-secondary)]">
              CivicLens connects the source, the jurisdiction, the business activity, and the next action so owners can verify what matters before it affects timing or cost.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURE_STRIPS.map(feature => (
              <div key={feature.title} className="rounded-[22px] border border-[var(--cl-border)] bg-surface p-4 shadow-1">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-navy-50 text-navy-700">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-h3 text-[var(--cl-text)]">{feature.title}</h3>
                <p className="mt-2 text-caption text-[var(--cl-text-secondary)]">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-navy-900 px-8 py-6 text-caption text-white/55">
        <div className="mx-auto flex max-w-marketing flex-col items-center justify-between gap-2 sm:flex-row">
          <span className="font-semibold text-white">CivicLens</span>
          <span>Informational guidance, not legal advice.</span>
          <div className="flex gap-4">
            <Link href="#sources" className="transition-colors hover:text-white">Sources</Link>
            <Link href="/intake" className="transition-colors hover:text-white">Free scan</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
