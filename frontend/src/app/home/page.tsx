import Link from 'next/link'
import { Nav } from '@/components/nav'
import { Button } from '@/components/ui/button'
import { FileText, Search, CheckCircle, ArrowRight } from 'lucide-react'

const SOURCES = [
  'Texas.gov', 'TABC', 'City of Austin', 'City of Dallas',
  'TX Comptroller', 'TX Legislature',
]

const HOW_IT_WORKS = [
  {
    icon: <FileText size={20} strokeWidth={1.5} />,
    title: 'Describe your business',
    body: 'Type your situation in plain English — location, industry, plans. No dropdown forms.',
  },
  {
    icon: <Search size={20} strokeWidth={1.5} />,
    title: 'We map the rules',
    body: 'Our RAG pipeline searches real government sources and maps every requirement that applies to you.',
  },
  {
    icon: <CheckCircle size={20} strokeWidth={1.5} />,
    title: 'Act with confidence',
    body: "Every finding links to its source. See what's new if you're moving cities, and track deadlines over time.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="marketing" />

      {/* ── Hero ── */}
      <section className="flex flex-col items-center text-center px-8 pt-20 pb-16 max-w-prose mx-auto w-full">
        <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-4">
          Regulatory intelligence for Texas business
        </p>
        <h1 className="text-display font-semibold text-[var(--cl-text)] mb-5 leading-tight">
          Know every rule that applies<br className="hidden sm:block" /> to your business.{' '}
          <span className="text-navy-600">Before it costs you.</span>
        </h1>
        <p className="text-body-lg text-[var(--cl-text-secondary)] mb-8 max-w-lg">
          Small business owners are exposed to compliance risk not because rules are hidden —
          but because they&apos;re fragmented across agencies, cities, and permits.
          CivicLens maps them for you, with citations.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
      </section>

      {/* ── Trust strip ── */}
      <section id="sources" className="border-y border-[var(--cl-border-subtle)] bg-surface px-8 py-4">
        <div className="max-w-marketing mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <span className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] whitespace-nowrap shrink-0">
            Sources we read:
          </span>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {SOURCES.map(s => (
              <span key={s} className="font-mono text-citation text-[var(--cl-text-secondary)] bg-sunken border border-[var(--cl-border-subtle)] rounded-sm px-2 py-0.5">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="px-8 py-16 max-w-marketing mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded flex items-center justify-center bg-navy-50 border border-[var(--cl-border)] text-navy-600">
                {step.icon}
              </div>
              <h3 className="text-h3 text-[var(--cl-text)]">{step.title}</h3>
              <p className="text-body text-[var(--cl-text-secondary)]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Human story / proof ── */}
      <section className="px-8 py-12 bg-surface border-t border-[var(--cl-border-subtle)]">
        <div className="max-w-prose mx-auto">
          <blockquote className="border-l-2 border-navy-600 pl-6">
            <p className="text-body-lg text-[var(--cl-text)] mb-3">
              &ldquo;I spent six weeks trying to figure out what licenses I needed to add a beer garden.
              I talked to three city departments and still missed the outdoor-service zoning requirement.
              The fine was $2,400 and a two-week closure.&rdquo;
            </p>
            <footer className="text-caption text-[var(--cl-text-muted)]">
              — Restaurant owner, Dallas TX &nbsp;·&nbsp; <span className="font-mono">$2,400 fine · 14-day closure</span>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto bg-navy-900 text-[var(--cl-text-muted)] px-8 py-6 text-caption">
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
