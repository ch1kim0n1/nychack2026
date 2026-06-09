'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'
import { heroEntrance, scrollReveal, initGsap } from '@/lib/gsap'

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
    body: 'Location, industry, activities, lease details, and operating plans become one civic context.',
  },
  {
    icon: <Search size={20} strokeWidth={1.5} />,
    title: 'Map the rule stack',
    body: 'CivicLens reads city, county, state, and agency sources, then ties citations to the requirements that matter.',
  },
  {
    icon: <CheckCircle size={20} strokeWidth={1.5} />,
    title: 'Turn risk into next steps',
    body: 'Findings become an action plan with contacts, documents, timing, and watchlist monitoring.',
  },
]

const INTELLIGENCE_ROWS = [
  ['City code', 'Outdoor service hours', 'Medium', 'Verify patio conditions before lease signing'],
  ['TABC', 'Alcohol permit dependency', 'High', 'Confirm local approval path and notice requirements'],
  ['Comptroller', 'Tax registration', 'Low', 'Prepare franchise and sales tax setup'],
]

const CIVIC_FEATURES = [
  {
    icon: <Building2 size={18} strokeWidth={1.5} />,
    title: 'Jurisdiction mapping',
    body: 'City, county, state, federal, and agency layers shown in one operating view.',
  },
  {
    icon: <Gavel size={18} strokeWidth={1.5} />,
    title: 'Policy change radar',
    body: 'Recent updates matched to the business profile instead of a generic news feed.',
  },
  {
    icon: <FileCheck2 size={18} strokeWidth={1.5} />,
    title: 'Cited source records',
    body: 'Every material finding keeps the public source close to the decision.',
  },
  {
    icon: <Route size={18} strokeWidth={1.5} />,
    title: 'Action sequencing',
    body: 'Blocking requirements, documents, contacts, and renewals organized by priority.',
  },
  {
    icon: <Map size={18} strokeWidth={1.5} />,
    title: 'Location sensitivity',
    body: 'Rules adapt to local operating context, not just industry keywords.',
  },
  {
    icon: <Bell size={18} strokeWidth={1.5} />,
    title: 'Ongoing watchlists',
    body: 'Saved profiles can be monitored as local rules and source pages change.',
  },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const howRef = useRef<HTMLDivElement>(null)
  const proofRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initGsap()
    if (heroRef.current) heroEntrance(heroRef.current)
    if (howRef.current) scrollReveal(howRef.current)
    if (proofRef.current) scrollReveal(proofRef.current)
  }, [])

  return (
    <div className="min-h-full flex flex-col bg-canvas text-[var(--cl-text)]">
      <Nav variant="marketing" />

      <section className="relative overflow-hidden border-b border-[var(--cl-border-subtle)] bg-surface">
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(var(--cl-navy-900)_1px,transparent_1px),linear-gradient(90deg,var(--cl-navy-900)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative max-w-marketing mx-auto px-6 sm:px-8 pt-16 pb-10 lg:pt-22 lg:pb-14">
          <div ref={heroRef} className="grid lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-12 items-center">
            <div>
              <p data-hero className="text-label uppercase tracking-[0.06em] text-navy-600 mb-4">
                Texas compliance intelligence for small business
              </p>
              <h1 data-hero className="text-[2.65rem] leading-[2.9rem] sm:text-[3.35rem] sm:leading-[3.55rem] font-semibold tracking-normal text-[var(--cl-text)] mb-5">
                Know the rules, risks, and policy changes that affect your business.
              </h1>
              <p data-hero className="text-body-lg text-[var(--cl-text-secondary)] mb-7 max-w-xl">
                CivicLens turns fragmented city, state, and agency requirements into a clear compliance picture with cited findings, deadlines, contacts, and action plans.
              </p>
              <div data-hero className="flex flex-col sm:flex-row gap-3">
                <Link href="/intake">
                  <Button size="lg">
                    Run a free risk scan <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="secondary" size="lg">
                    See a live example
                  </Button>
                </Link>
              </div>
              <div data-hero className="mt-8 grid grid-cols-3 gap-5 max-w-lg border-t border-[var(--cl-border-subtle)] pt-5">
                <div>
                  <p className="font-mono text-h2 text-[var(--cl-text)]">4</p>
                  <p className="text-caption text-[var(--cl-text-muted)]">Jurisdiction layers</p>
                </div>
                <div>
                  <p className="font-mono text-h2 text-[var(--cl-text)]">30d</p>
                  <p className="text-caption text-[var(--cl-text-muted)]">Policy radar window</p>
                </div>
                <div>
                  <p className="font-mono text-h2 text-[var(--cl-text)]">100%</p>
                  <p className="text-caption text-[var(--cl-text-muted)]">Source cited findings</p>
                </div>
              </div>
            </div>

            <div data-hero className="rounded-lg border border-[var(--cl-border)] bg-canvas shadow-2 overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--cl-border-subtle)] bg-navy-900 px-5 py-4 text-white">
                <div>
                  <p className="text-caption text-white/60 font-mono">Austin, TX</p>
                  <p className="text-body font-semibold">Restaurant with patio and alcohol service</p>
                </div>
                <ShieldCheck size={20} strokeWidth={1.5} className="text-white/80" />
              </div>
              <div className="p-5">
                <div className="grid grid-cols-[120px_1fr] gap-4 pb-4 border-b border-[var(--cl-border-subtle)]">
                  <div>
                    <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">Risk score</p>
                    <p className="font-mono text-[2.1rem] leading-none text-risk-med-fg">68</p>
                  </div>
                  <div className="space-y-2">
                    {['Lease issue before signing', 'Agency approval dependency', 'Outdoor seating condition'].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 text-caption text-[var(--cl-text-secondary)]">
                        <span className="h-5 w-5 rounded-sm border border-[var(--cl-border)] bg-surface flex items-center justify-center font-mono text-citation text-[var(--cl-text-muted)]">{i + 1}</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">Live intelligence view</p>
                  <div className="overflow-hidden rounded border border-[var(--cl-border-subtle)] bg-surface">
                    {INTELLIGENCE_ROWS.map(([source, issue, level, action], i) => (
                      <div key={issue} className="grid grid-cols-[88px_1fr] sm:grid-cols-[92px_1fr_78px] gap-3 px-3 py-3 border-b last:border-b-0 border-[var(--cl-border-subtle)]">
                        <span className="font-mono text-citation text-[var(--cl-text-muted)]">{source}</span>
                        <div>
                          <p className="text-caption font-semibold text-[var(--cl-text)]">{issue}</p>
                          <p className="text-citation text-[var(--cl-text-secondary)]">{action}</p>
                        </div>
                        <span className={`hidden sm:inline-flex justify-center self-start rounded-sm border px-2 py-0.5 font-mono text-citation ${
                          i === 1
                            ? 'text-risk-high-fg bg-risk-high-bg border-risk-high-border'
                            : i === 0
                              ? 'text-risk-med-fg bg-risk-med-bg border-risk-med-border'
                              : 'text-risk-low-fg bg-risk-low-bg border-risk-low-border'
                        }`}>
                          {level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sources" className="border-b border-[var(--cl-border-subtle)] bg-canvas px-6 sm:px-8 py-4">
        <div className="max-w-marketing mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <span className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] whitespace-nowrap shrink-0">
            Sources we read:
          </span>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {SOURCES.map((source) => (
              <span key={source} className="font-mono text-citation text-[var(--cl-text-secondary)] bg-surface border border-[var(--cl-border-subtle)] rounded-sm px-2 py-0.5">
                {source}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 sm:px-8 py-16 max-w-marketing mx-auto w-full">
        <div ref={howRef} className="grid lg:grid-cols-[0.82fr_1.18fr] gap-10 lg:gap-14 items-start">
          <div>
            <p className="text-label uppercase tracking-[0.06em] text-navy-600 mb-3">From rule search to operating plan</p>
            <h2 className="text-h1 text-[var(--cl-text)] mb-4">Local compliance findings with public sources attached.</h2>
            <p className="text-body-lg text-[var(--cl-text-secondary)]">
              The product is built around the way local rules actually work: overlapping jurisdictions, agency guidance, permit dependencies, effective dates, and practical business impact.
            </p>
          </div>
          <div className="relative pl-6 border-l border-[var(--cl-border)]">
            {WORKFLOW.map((step, i) => (
              <div key={step.title} className="relative pb-9 last:pb-0">
                <div className="absolute -left-[2.15rem] top-0 w-10 h-10 rounded bg-surface border border-[var(--cl-border)] shadow-1 flex items-center justify-center text-navy-600">
                  {step.icon}
                </div>
                <p className="font-mono text-citation text-[var(--cl-text-muted)] mb-1">0{i + 1}</p>
                <h3 className="text-h3 text-[var(--cl-text)] mb-1">{step.title}</h3>
                <p className="text-body text-[var(--cl-text-secondary)]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-8 py-16 bg-surface border-y border-[var(--cl-border-subtle)]">
        <div ref={proofRef} className="max-w-marketing mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          <div>
            <p className="text-label uppercase tracking-[0.06em] text-navy-600 mb-3">Built for real civic risk</p>
            <h2 className="text-h1 text-[var(--cl-text)] mb-4">Cited playbooks for Texas operators.</h2>
            <p className="text-body-lg text-[var(--cl-text-secondary)]">
              CivicLens connects the source, the jurisdiction, the business activity, and the next action so owners can decide what to verify before it becomes expensive.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            {CIVIC_FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-3">
                <div className="mt-0.5 h-8 w-8 shrink-0 rounded bg-navy-50 border border-[var(--cl-border-subtle)] text-navy-600 flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-body font-semibold text-[var(--cl-text)]">{feature.title}</h3>
                  <p className="text-caption text-[var(--cl-text-secondary)] mt-1">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-navy-900 text-[var(--cl-text-muted)] px-8 py-6 text-caption">
        <div className="max-w-marketing mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-white">CivicLens</span>
          <span>Informational guidance, not legal advice.</span>
          <div className="flex gap-4">
            <Link href="#sources" className="hover:text-white transition-colors">Sources</Link>
            <Link href="/intake" className="hover:text-white transition-colors">Free scan</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
