'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, CheckCircle, Mail, MapPin } from 'lucide-react'
import { Nav } from '@/components/nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="marketing" />

      <main className="flex-1 px-6 py-12 max-w-marketing mx-auto w-full">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-caption text-navy-600 hover:text-navy-700 mb-8">
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to pricing
        </Link>

        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-14 items-start">
          <div>
            <p className="text-label uppercase tracking-[0.06em] text-navy-600 mb-3">Multi-location plans</p>
            <h1 className="text-h1 text-[var(--cl-text)] mb-4">Talk with CivicLens about coverage for every location.</h1>
            <p className="text-body-lg text-[var(--cl-text-secondary)] mb-6">
              Tell us where you operate and what you monitor. We&apos;ll follow up with the next best fit for multi-city compliance tracking.
            </p>

            <div className="space-y-3">
              {[
                { icon: <Building2 size={16} strokeWidth={1.5} />, text: 'Unlimited locations and saved profiles' },
                { icon: <MapPin size={16} strokeWidth={1.5} />, text: 'Cross-location diff comparison' },
                { icon: <Mail size={16} strokeWidth={1.5} />, text: 'Priority support for rollout questions' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 text-body text-[var(--cl-text-secondary)]">
                  <span className="h-8 w-8 rounded bg-navy-50 border border-[var(--cl-border-subtle)] text-navy-600 flex items-center justify-center shrink-0">
                    {item.icon}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-[var(--cl-border)] bg-surface p-6 shadow-1">
            {submitted ? (
              <div className="min-h-[360px] flex flex-col items-start justify-center">
                <CheckCircle size={32} strokeWidth={1.5} className="text-risk-low-fg mb-4" />
                <h2 className="text-h2 text-[var(--cl-text)] mb-2">We&apos;ll be in touch.</h2>
                <p className="text-body text-[var(--cl-text-secondary)] mb-6">
                  Your request is queued for follow-up. For now, you can still run a free scan or build an expansion scenario.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/intake">
                    <Button size="md">Run a free scan</Button>
                  </Link>
                  <Link href="/scenarios">
                    <Button variant="secondary" size="md">Build a scenario</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">
                    Name
                  </label>
                  <Input id="name" name="name" required autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">
                    Work email
                  </label>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="locations" className="block text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">
                    Locations
                  </label>
                  <Input id="locations" name="locations" placeholder="Austin, Dallas, Houston" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">
                    What should CivicLens cover?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full bg-surface border border-[var(--cl-border)] rounded-sm px-3 py-3 text-body text-[var(--cl-text)] placeholder:text-[var(--cl-text-muted)] transition-[border-color,box-shadow] duration-[140ms] focus:outline-none focus:border-[var(--cl-border-strong)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cl-navy-600)_40%,transparent)]"
                    placeholder="Franchise locations, city-by-city permitting, weekly policy monitoring..."
                  />
                </div>
                <Button type="submit" size="md" className="w-full">
                  Request follow-up <Mail size={15} />
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
