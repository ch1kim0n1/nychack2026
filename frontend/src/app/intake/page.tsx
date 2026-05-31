'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { IntakeTextarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { api, type BusinessProfile } from '@/lib/api'
import { CheckCircle, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const EXAMPLE_SCENARIOS = [
  {
    label: 'Food truck → Austin restaurant',
    text: 'I own a food truck in Dallas with 3 employees. I want to open a brick-and-mortar restaurant in Austin with a beer garden.',
  },
  {
    label: 'Salon adding nail services',
    text: 'I run a hair salon in Houston and want to add nail services and waxing.',
  },
  {
    label: 'Retail adding e-commerce',
    text: 'I have a retail clothing store in San Antonio and want to add online delivery and e-commerce.',
  },
]

type Stage = 'intake' | 'classifying' | 'review' | 'error'

export default function IntakePage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [stage, setStage] = useState<Stage>('intake')
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  async function handleAnalyze() {
    if (!text || text.length < 15) return
    setStage('classifying')
    setAnalyzing(true)
    setError('')
    try {
      const result = await api.classifyProfile(text)
      setProfile(result)
      setStage('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStage('error')
    } finally {
      setAnalyzing(false)
    }
  }

  function handleConfirm() {
    if (!profile) return
    // Store profile in sessionStorage for the dashboard to read
    sessionStorage.setItem('cl-profile', JSON.stringify(profile))
    sessionStorage.setItem('cl-input', text)
    router.push('/dashboard')
  }

  function handleEdit() {
    setStage('intake')
    setProfile(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="marketing" />

      <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-16 max-w-prose mx-auto w-full">
        <div className="w-full mb-8">
          <h1 className="text-h1 text-[var(--cl-text)] mb-1">Describe your business</h1>
          <p className="text-caption text-[var(--cl-text-muted)]">Plain English. No forms.</p>
        </div>

        {/* ── Intake field ── */}
        {(stage === 'intake' || stage === 'error') && (
          <div className="w-full space-y-4">
            <IntakeTextarea
              placeholder={'I own a food truck in Dallas with 3 employees. I want to open a\nbrick-and-mortar restaurant in Austin and add alcohol service.'}
              value={text}
              onChange={e => setText(e.target.value)}
              onAnalyze={handleAnalyze}
              analyzing={analyzing}
            />
            {stage === 'error' && (
              <p className="text-caption text-risk-high-fg bg-risk-high-bg border border-risk-high-border rounded px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption text-[var(--cl-text-muted)]">Try an example:</span>
              {EXAMPLE_SCENARIOS.map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setText(s.text)}
                  className={cn(
                    'px-3 py-1 rounded-sm border border-[var(--cl-border)] text-caption text-[var(--cl-text-secondary)]',
                    'bg-surface hover:bg-navy-50 hover:border-[var(--cl-border-strong)]',
                    'transition-colors duration-[80ms]',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Classifying ── */}
        {stage === 'classifying' && (
          <div className="w-full space-y-3">
            <div className="bg-surface border border-[var(--cl-border)] rounded p-5">
              <p className="text-caption text-[var(--cl-text-muted)] font-mono animate-pulse">
                Reading regulations…
              </p>
            </div>
          </div>
        )}

        {/* ── Classification review panel ── */}
        {stage === 'review' && profile && (
          <div className="w-full">
            <div className="bg-surface border border-[var(--cl-border)] rounded p-5 shadow-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)]">
                  We read this as
                </p>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 text-caption text-navy-600 hover:text-navy-700 transition-colors"
                >
                  <Edit2 size={13} strokeWidth={1.5} />
                  Edit
                </button>
              </div>

              <dl className="space-y-2 font-mono text-data mb-5">
                <KV k="industry" v={profile.industry} />
                <KV k="location" v={profile.location} />
                {profile.expansion_locations.length > 0 && (
                  <KV k="expansion" v={profile.expansion_locations.join(', ')} />
                )}
                {profile.activities.length > 0 && (
                  <KV k="activities" v={profile.activities.join(', ')} />
                )}
                {profile.employees !== null && (
                  <KV k="employees" v={String(profile.employees)} />
                )}
              </dl>

              <div className="flex gap-3">
                <Button onClick={handleConfirm} size="md">
                  <CheckCircle size={15} strokeWidth={1.5} />
                  Looks right — analyze
                </Button>
                <Button variant="ghost" onClick={handleEdit} size="md">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <DisclaimerBanner />
    </div>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4">
      <dt className="text-[var(--cl-text-muted)] w-24 shrink-0">{k}</dt>
      <dd className="text-[var(--cl-text)]">{v}</dd>
    </div>
  )
}
