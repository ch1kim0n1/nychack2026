'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BellRing,
  Bot,
  Building2,
  CheckCircle2,
  FileSearch,
  MapPinned,
  Scale,
  ShieldCheck,
} from 'lucide-react'
import { InteractiveTexasMap } from '@/components/landing/interactive-texas-map'
import { LandingDashboard } from '@/components/landing/landing-dashboard'

const FEATURES = [
  {
    icon: FileSearch,
    title: 'Regulatory risk scanning',
    body: 'Scan state, county, and city sources against a specific Texas business profile.',
  },
  {
    icon: Building2,
    title: 'Cross-city compliance diff',
    body: 'Compare requirements across Austin, Dallas, Houston, San Antonio, and Richardson.',
  },
  {
    icon: Bot,
    title: 'AI-powered classification',
    body: 'Classify rule changes by activity, location, risk level, and operating impact.',
  },
  {
    icon: ShieldCheck,
    title: 'Citation-verified findings',
    body: 'Keep the source attached to every compliance claim and next-step recommendation.',
  },
  {
    icon: BellRing,
    title: 'Compliance Pulse monitoring',
    body: 'Track saved profiles as agency pages, city codes, and effective dates change.',
  },
  {
    icon: MapPinned,
    title: 'Expansion planning intelligence',
    body: 'Surface local risk before a lease, launch, or new Texas market decision.',
  },
]

const navLinks = [
  { label: 'Product', href: '#product' },
  { label: 'Map', href: '#map' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '/pricing' },
]

export default function LandingPage() {
  const reducedMotion = useReducedMotion()
  const heroInitial = reducedMotion ? false : { opacity: 0, y: 30 }
  const featureContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.1,
      },
    },
  }
  const featureItem = {
    hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <main className="min-h-screen bg-white text-[#101820]">
      <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/90 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8" aria-label="Primary navigation">
          <Link href="/home" className="flex items-center gap-3 text-[#101820]">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#101820] text-sm font-bold text-white">
              CL
            </span>
            <span className="text-base font-bold">CivicLens</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map(link => (
              <Link key={link.label} href={link.href} className="text-sm font-medium text-[#4b5563] transition-colors hover:text-[#101820]">
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            href="/intake"
            className="inline-flex items-center gap-2 rounded-[8px] bg-[#315f5c] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(49,95,92,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(49,95,92,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f5c]"
          >
            Start scan
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </nav>
      </header>

      <section className="border-b border-[#edf0f3] bg-[#fbfcfd]">
        <div className="mx-auto max-w-[1180px] px-5 pb-16 pt-16 sm:px-8 lg:pb-24 lg:pt-24">
          <motion.div
            initial={heroInitial}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#d9dde3] bg-white px-3 py-1 text-sm font-semibold text-[#315f5c] shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
              <Scale size={14} strokeWidth={1.8} aria-hidden="true" />
              AI-Powered Compliance Intelligence
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-[0.98] text-[#101820] sm:text-6xl lg:text-7xl">
              Regulatory intelligence for Texas small businesses.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#4b5563]">
              CivicLens turns fragmented Texas rules into cited, location-aware guidance before compliance risk slows a launch or expansion.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/intake"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-[#315f5c] px-5 text-base font-semibold text-white shadow-[0_10px_22px_rgba(49,95,92,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(49,95,92,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f5c]"
              >
                Run a free risk scan
                <ArrowRight size={17} strokeWidth={1.8} />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-12 items-center justify-center rounded-[8px] border border-[#cfd6dc] bg-white px-5 text-base font-semibold text-[#17202b] shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f5c]"
              >
                View demo
              </Link>
            </div>
          </motion.div>

          <motion.div
            id="map"
            initial={reducedMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: reducedMotion ? 0 : 0.1 }}
            className="mx-auto mt-14 max-w-5xl"
          >
            <InteractiveTexasMap className="min-h-[500px] shadow-[0_24px_70px_rgba(15,23,42,0.12)]" />
          </motion.div>
        </div>
      </section>

      <LandingDashboard />

      <section id="features" className="border-y border-[#edf0f3] bg-[#fbfcfd]">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-[#4f7d7a]">Built for Texas operators</p>
            <h2 className="mt-3 text-3xl font-bold leading-[1.05] text-[#101820] sm:text-5xl">
              Compliance work that stays tied to place, source, and action.
            </h2>
          </div>

          <motion.div
            variants={featureContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map(feature => {
              const Icon = feature.icon

              return (
                <motion.article
                  key={feature.title}
                  variants={featureItem}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="rounded-[8px] border border-[#d9dde3] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#edf5f3] text-[#315f5c]">
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#111827]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5b6573]">{feature.body}</p>
                </motion.article>
              )
            })}
          </motion.div>
        </div>
      </section>

      <section className="bg-[#101820] px-5 py-16 text-white sm:px-8 lg:py-20">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-white/60">CivicLens for Texas small business</p>
            <h2 className="mt-3 text-3xl font-bold leading-[1.05] sm:text-5xl">
              See the compliance picture before you commit.
            </h2>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-white px-5 text-base font-semibold text-[#101820] shadow-[0_12px_28px_rgba(255,255,255,0.16)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(255,255,255,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Request access
            <CheckCircle2 size={17} strokeWidth={1.8} />
          </Link>
        </div>
      </section>
    </main>
  )
}
