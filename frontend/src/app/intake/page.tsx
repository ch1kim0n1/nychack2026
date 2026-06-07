'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { IntakeTextarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { api, type BusinessProfile } from '@/lib/api'
import { CheckCircle, Edit2, HelpCircle, ChevronRight, Zap } from 'lucide-react'
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

// Follow-up questions triggered by detected activities (9.7 Business Change Detector)
interface FollowUpQuestion {
  id: string
  trigger: (profile: BusinessProfile) => boolean
  question: string
  options: { label: string; value: string; detail?: string }[]
  applyAnswer: (profile: BusinessProfile, answer: string) => BusinessProfile
}

const FOLLOW_UP_QUESTIONS: FollowUpQuestion[] = [
  {
    id: 'outdoor_seating',
    trigger: p => p.activities.includes('alcohol_planned') && !p.activities.includes('outdoor_seating'),
    question: 'You mentioned alcohol service. Will there be outdoor seating (e.g. a beer garden or patio)?',
    options: [
      { label: 'Yes, outdoor seating planned', value: 'yes', detail: 'Adds zoning + outdoor service permit requirements' },
      { label: 'No, indoors only', value: 'no' },
    ],
    applyAnswer: (profile, answer) =>
      answer === 'yes'
        ? { ...profile, activities: [...profile.activities, 'outdoor_seating'] }
        : profile,
  },
  {
    id: 'tabc_existing',
    trigger: p => p.activities.includes('alcohol_planned') && p.expansion_locations.length > 0,
    question: 'Do you already hold a TABC license at your current location?',
    options: [
      { label: 'Yes, I have an existing TABC license', value: 'yes', detail: 'Affects transfer vs. new application path' },
      { label: 'No, this is my first alcohol license', value: 'no' },
    ],
    applyAnswer: (profile, answer) =>
      answer === 'yes'
        ? { ...profile, activities: [...profile.activities, 'tabc_existing'] }
        : profile,
  },
  {
    id: 'employees_hiring',
    trigger: p => (p.employees ?? 0) < 5 && p.expansion_locations.length > 0,
    question: 'Will you hire employees for the new location?',
    options: [
      { label: 'Yes, I plan to hire staff', value: 'yes', detail: 'May trigger employer registration and withholding requirements' },
      { label: 'No, owner-operated', value: 'no' },
    ],
    applyAnswer: (profile, answer) =>
      answer === 'yes'
        ? { ...profile, activities: [...profile.activities, 'hiring_employees'] }
        : profile,
  },
  {
    id: 'food_delivery',
    trigger: p => p.industry === 'food_service' && !p.activities.includes('delivery'),
    question: 'Will the new location offer delivery (e.g. DoorDash, Uber Eats, or own drivers)?',
    options: [
      { label: 'Yes, delivery planned', value: 'yes', detail: 'May require additional permits in some jurisdictions' },
      { label: 'No, dine-in / carry-out only', value: 'no' },
    ],
    applyAnswer: (profile, answer) =>
      answer === 'yes'
        ? { ...profile, activities: [...profile.activities, 'delivery'] }
        : profile,
  },
]

type Stage = 'intake' | 'classifying' | 'review' | 'followup' | 'confirming' | 'error'

export default function IntakePage() {
  const router = useRouter()
  const [text, setText] = useState('')

  // Apply prefill from scenario builder if present
  useEffect(() => {
    const prefill = sessionStorage.getItem('cl-prefill')
    if (prefill) { setText(prefill); sessionStorage.removeItem('cl-prefill') }
  }, [])
  const [stage, setStage] = useState<Stage>('intake')
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  // Follow-up state
  const [followupQueue, setFollowupQueue] = useState<FollowUpQuestion[]>([])
  const [currentFollowup, setCurrentFollowup] = useState(0)

  async function handleAnalyze(overrideText?: string) {
    const inputText = overrideText ?? text
    if (!inputText || inputText.length < 15) return
    setStage('classifying')
    setAnalyzing(true)
    setError('')
    try {
      const result = await api.classifyProfile(inputText)
      setProfile(result)

      // Determine which follow-up questions apply (9.7 Business Change Detector)
      const applicable = FOLLOW_UP_QUESTIONS.filter(q => q.trigger(result))
      if (applicable.length > 0) {
        setFollowupQueue(applicable)
        setCurrentFollowup(0)
        setStage('followup')
      } else {
        setStage('review')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStage('error')
    } finally {
      setAnalyzing(false)
    }
  }

  function handleFollowupAnswer(answer: string) {
    if (!profile) return
    const q = followupQueue[currentFollowup]
    const updated = q.applyAnswer(profile, answer)
    setProfile(updated)

    if (currentFollowup + 1 < followupQueue.length) {
      setCurrentFollowup(i => i + 1)
    } else {
      setStage('review')
    }
  }

  function handleConfirm() {
    if (!profile) return
    sessionStorage.setItem('cl-profile', JSON.stringify(profile))
    sessionStorage.setItem('cl-input', text)
    router.push('/dashboard')
  }

  function handleDemoPreload() {
    const demoText = EXAMPLE_SCENARIOS[0].text
    setText(demoText)
    void handleAnalyze(demoText)
  }

  function handleEdit() {
    setStage('intake')
    setProfile(null)
    setFollowupQueue([])
    setCurrentFollowup(0)
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
              <div className="text-caption text-risk-high-fg bg-risk-high-bg border border-risk-high-border rounded px-3 py-2 space-y-2">
                <p>{error}</p>
                <p>
                  <button
                    type="button"
                    onClick={() => router.push('/demo')}
                    className="underline hover:no-underline font-semibold"
                  >
                    Use demo data instead →
                  </button>
                </p>
              </div>
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
              <button
                type="button"
                onClick={handleDemoPreload}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-sm border text-caption',
                  'border-navy-600 bg-navy-50 text-navy-600 hover:bg-navy-100',
                  'transition-colors duration-[80ms]',
                )}
              >
                <Zap size={12} strokeWidth={1.5} />
                Demo: fill & analyze
              </button>
            </div>
          </div>
        )}

        {/* ── Classifying ── */}
        {stage === 'classifying' && (
          <div className="w-full">
            <div className="bg-surface border border-[var(--cl-border)] rounded p-5">
              <p className="text-caption text-[var(--cl-text-muted)] font-mono animate-pulse">
                Reading regulations…
              </p>
            </div>
          </div>
        )}

        {/* ── Follow-up questions (14.5, 9.7) ── */}
        {stage === 'followup' && followupQueue.length > 0 && (
          <div className="w-full">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-4 text-caption text-[var(--cl-text-muted)]">
              <HelpCircle size={13} strokeWidth={1.5} />
              <span>Follow-up {currentFollowup + 1} of {followupQueue.length}: helps us be more accurate</span>
              <span className="ml-auto font-mono">{Math.round(((currentFollowup) / followupQueue.length) * 100)}%</span>
            </div>
            <div className="h-1 bg-sunken rounded-full mb-5 overflow-hidden">
              <div className="h-full bg-navy-600 rounded-full transition-all" style={{ width: `${(currentFollowup / followupQueue.length) * 100}%` }} />
            </div>

            <div className="bg-surface border border-[var(--cl-border)] rounded p-5 shadow-1">
              <p className="text-body-lg text-[var(--cl-text)] mb-5">
                {followupQueue[currentFollowup].question}
              </p>
              <div className="flex flex-col gap-2">
                {followupQueue[currentFollowup].options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleFollowupAnswer(opt.value)}
                    className={cn(
                      'flex items-start gap-3 text-left px-4 py-3 rounded border transition-colors duration-[80ms]',
                      'border-[var(--cl-border)] bg-surface hover:bg-navy-50 hover:border-navy-600',
                    )}
                  >
                    <ChevronRight size={16} strokeWidth={1.5} className="text-navy-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body font-semibold text-[var(--cl-text)]">{opt.label}</p>
                      {opt.detail && <p className="text-caption text-[var(--cl-text-muted)] mt-0.5">{opt.detail}</p>}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  if (currentFollowup + 1 < followupQueue.length) setCurrentFollowup(i => i + 1)
                  else setStage('review')
                }}
                className="mt-4 text-caption text-[var(--cl-text-muted)] hover:text-[var(--cl-text)] underline"
              >
                Skip this question
              </button>
            </div>
          </div>
        )}

        {/* ── Classification review ── */}
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
                  Looks right: analyze
                </Button>
                <Button variant="ghost" onClick={handleEdit} size="md">Edit</Button>
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
