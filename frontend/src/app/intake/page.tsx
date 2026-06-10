'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  ChevronRight,
  Edit2,
  ExternalLink,
  HelpCircle,
  MapPin,
  Radar,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { IntakeTextarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { api, type BusinessProfile } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AUSTIN_DEMO_BUSINESSES, type AustinDemoBusiness } from '@/data/austin-demo-businesses'

const AustinBusinessPickerMap = dynamic(
  () => import('@/components/map/AustinBusinessPickerMap').then(module => ({ default: module.AustinBusinessPickerMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] w-full items-center justify-center bg-[var(--cl-sunken)] text-caption text-[var(--cl-text-muted)]">
        Loading Austin business map...
      </div>
    ),
  },
)

const EXAMPLE_SCENARIOS = [
  {
    label: 'Food truck -> Austin restaurant',
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
    trigger: profile => profile.activities.includes('alcohol_planned') && !profile.activities.includes('outdoor_seating'),
    question: 'You mentioned alcohol service. Will there be outdoor seating, such as a patio or beer garden?',
    options: [
      { label: 'Yes, outdoor seating is planned', value: 'yes', detail: 'Adds zoning and outdoor service requirements.' },
      { label: 'No, indoors only', value: 'no' },
    ],
    applyAnswer: (profile, answer) =>
      answer === 'yes'
        ? { ...profile, activities: [...profile.activities, 'outdoor_seating'] }
        : profile,
  },
  {
    id: 'tabc_existing',
    trigger: profile => profile.activities.includes('alcohol_planned') && profile.expansion_locations.length > 0,
    question: 'Do you already hold a TABC license at your current location?',
    options: [
      { label: 'Yes, there is an existing TABC license', value: 'yes', detail: 'Changes transfer versus new application logic.' },
      { label: 'No, this is the first alcohol license', value: 'no' },
    ],
    applyAnswer: (profile, answer) =>
      answer === 'yes'
        ? { ...profile, activities: [...profile.activities, 'tabc_existing'] }
        : profile,
  },
  {
    id: 'employees_hiring',
    trigger: profile => (profile.employees ?? 0) < 5 && profile.expansion_locations.length > 0,
    question: 'Will you hire employees for the new location?',
    options: [
      { label: 'Yes, staff will be hired', value: 'yes', detail: 'May trigger employer registration and withholding steps.' },
      { label: 'No, owner-operated', value: 'no' },
    ],
    applyAnswer: (profile, answer) =>
      answer === 'yes'
        ? { ...profile, activities: [...profile.activities, 'hiring_employees'] }
        : profile,
  },
  {
    id: 'food_delivery',
    trigger: profile => profile.industry === 'food_service' && !profile.activities.includes('delivery'),
    question: 'Will the business offer delivery through apps or its own drivers?',
    options: [
      { label: 'Yes, delivery is planned', value: 'yes', detail: 'Can add local permitting or operational conditions.' },
      { label: 'No, dine-in or carry-out only', value: 'no' },
    ],
    applyAnswer: (profile, answer) =>
      answer === 'yes'
        ? { ...profile, activities: [...profile.activities, 'delivery'] }
        : profile,
  },
]

const RAIL_STEPS = [
  { title: 'Describe the business', body: 'Use plain English when you already know the target profile.' },
  { title: 'Or pick from map', body: 'Click a real Austin establishment on the interactive map in demo scope.' },
  { title: 'Run AI intake', body: 'The selected place details become the AI input before the dashboard loads.' },
]

type Stage = 'intake' | 'classifying' | 'review' | 'followup' | 'error'
type IntakeMode = 'describe' | 'map'

export default function IntakePage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [stage, setStage] = useState<Stage>('intake')
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [followupQueue, setFollowupQueue] = useState<FollowUpQuestion[]>([])
  const [currentFollowup, setCurrentFollowup] = useState(0)
  const [mode, setMode] = useState<IntakeMode>('describe')
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedBusinessSummary, setSelectedBusinessSummary] = useState('')

  const selectedBusiness = AUSTIN_DEMO_BUSINESSES.find(business => business.id === selectedBusinessId) ?? null

  useEffect(() => {
    const prefill = sessionStorage.getItem('cl-prefill')
    if (prefill) {
      setText(prefill)
      sessionStorage.removeItem('cl-prefill')
    }
  }, [])

  function resetAnalysisState() {
    setStage('intake')
    setProfile(null)
    setFollowupQueue([])
    setCurrentFollowup(0)
    setError('')
    setAnalyzing(false)
  }

  function switchMode(nextMode: IntakeMode) {
    setMode(nextMode)
    resetAnalysisState()
  }

  async function handleAnalyze(overrideText?: string) {
    const inputText = typeof overrideText === 'string' ? overrideText : text
    if (!inputText || inputText.length < 15) {
      setError('Please describe your business in plain English with at least 15 characters.')
      setStage('error')
      return
    }

    setStage('classifying')
    setAnalyzing(true)
    setError('')

    try {
      const result = await api.classifyProfile(inputText)
      setProfile(result)

      const applicable = FOLLOW_UP_QUESTIONS.filter(question => question.trigger(result))
      if (applicable.length > 0) {
        setFollowupQueue(applicable)
        setCurrentFollowup(0)
        setStage('followup')
      } else {
        setStage('review')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.')
      setStage('error')
    } finally {
      setAnalyzing(false)
    }
  }

  function handleFollowupAnswer(answer: string) {
    if (!profile) return
    const question = followupQueue[currentFollowup]
    const updated = question.applyAnswer(profile, answer)
    setProfile(updated)

    if (currentFollowup + 1 < followupQueue.length) {
      setCurrentFollowup(index => index + 1)
    } else {
      setStage('review')
    }
  }

  function handleConfirm() {
    if (!profile) return
    sessionStorage.setItem('cl-profile', JSON.stringify(profile))
    sessionStorage.setItem('cl-input', mode === 'map' ? selectedBusinessSummary : text)
    router.push('/dashboard')
  }

  function handleUseMapBusiness() {
    if (!selectedBusiness) return
    setSelectedBusinessSummary(selectedBusiness.scanSummary)
    setText(selectedBusiness.scanSummary)
    void handleAnalyze(selectedBusiness.generatedInput)
  }

  function handleDemoPreload() {
    const demoText = EXAMPLE_SCENARIOS[0].text
    setMode('describe')
    setText(demoText)
    void handleAnalyze(demoText)
  }

  const activeFollowup = followupQueue[currentFollowup]
  const progress = followupQueue.length > 0 ? ((currentFollowup + 1) / followupQueue.length) * 100 : 0

  return (
    <div className="min-h-screen bg-canvas">
      <Nav variant="marketing" />

      <main className="mx-auto grid max-w-[1260px] gap-8 px-4 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section className="cl-shell-grid relative overflow-hidden rounded-[32px] border border-[var(--cl-border)] bg-white/60 p-6 shadow-2 sm:p-8">
          <div className="relative">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--cl-border)] bg-white/80 px-3 py-1 text-[12px] uppercase tracking-[0.18em] text-navy-700 shadow-1">
                  <Sparkles size={12} strokeWidth={1.5} />
                  Demo intake
                </div>
                <h1 className="mt-4 max-w-[12ch] text-[3rem] font-bold leading-[0.98] tracking-[-0.05em] text-[var(--cl-text)] sm:text-[3.5rem]">
                  Start from a description or an Austin map pick.
                </h1>
                <p className="mt-3 max-w-2xl text-body-lg text-[var(--cl-text-secondary)]">
                  Use plain English when you know the business, or click a public Austin establishment on the map and let the AI turn that place data into the intake request.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['2', 'intake modes'],
                  ['Austin', 'map scope'],
                  ['AI', 'place to profile'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-[var(--cl-border)] bg-white/75 px-3 py-3 shadow-1">
                    <p className="font-mono text-h2 text-[var(--cl-text)]">{value}</p>
                    <p className="mt-1 text-citation uppercase tracking-[0.08em] text-[var(--cl-text-muted)]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 inline-flex rounded-full border border-[var(--cl-border)] bg-white/80 p-1 shadow-1">
              <button
                type="button"
                onClick={() => switchMode('describe')}
                className={cn(
                  'rounded-full px-4 py-2 text-caption font-semibold transition-colors',
                  mode === 'describe'
                    ? 'bg-navy-600 text-white'
                    : 'text-[var(--cl-text-secondary)] hover:bg-navy-50',
                )}
              >
                Describe a business
              </button>
              <button
                type="button"
                onClick={() => switchMode('map')}
                className={cn(
                  'rounded-full px-4 py-2 text-caption font-semibold transition-colors',
                  mode === 'map'
                    ? 'bg-navy-600 text-white'
                    : 'text-[var(--cl-text-secondary)] hover:bg-navy-50',
                )}
              >
                Pick from Austin map
              </button>
            </div>

            {(stage === 'intake' || stage === 'error') && mode === 'describe' && (
              <div className="space-y-5">
                <IntakeTextarea
                  placeholder={'I own a food truck in Dallas with 3 employees. I want to open a\nbrick-and-mortar restaurant in Austin and add alcohol service.'}
                  value={text}
                  onChange={event => setText(event.target.value)}
                  onAnalyze={() => void handleAnalyze()}
                  analyzing={analyzing}
                  invalid={stage === 'error'}
                />

                {stage === 'error' && (
                  <div className="rounded-2xl border border-risk-high-border bg-risk-high-bg px-4 py-3 text-caption text-risk-high-fg">
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={() => router.push('/demo')}
                      className="mt-2 font-semibold underline hover:no-underline"
                    >
                      Use demo data instead -&gt;
                    </button>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {EXAMPLE_SCENARIOS.map(example => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => setText(example.text)}
                      className={cn(
                        'rounded-[22px] border border-[var(--cl-border)] bg-white/80 px-4 py-4 text-left shadow-1 transition-colors duration-[80ms]',
                        'hover:border-[var(--cl-border-strong)] hover:bg-navy-50',
                      )}
                    >
                      <p className="text-body font-semibold text-[var(--cl-text)]">{example.label}</p>
                      <p className="mt-2 text-caption text-[var(--cl-text-secondary)]">{example.text}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleDemoPreload}
                    className="rounded-[22px] border border-navy-600 bg-navy-50 px-4 py-4 text-left shadow-1 transition-colors duration-[80ms] hover:bg-navy-100"
                  >
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-navy-600 text-white">
                      <Zap size={15} strokeWidth={1.5} />
                    </div>
                    <p className="mt-3 text-body font-semibold text-navy-700">Demo: fill and analyze</p>
                    <p className="mt-2 text-caption text-navy-700/75">
                      Runs the strongest text-based demo route end to end.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {(stage === 'intake' || stage === 'error') && mode === 'map' && (
              <AustinMapPicker
                selectedBusiness={selectedBusiness}
                onSelectBusiness={businessId => setSelectedBusinessId(businessId)}
                onUseSelectedBusiness={handleUseMapBusiness}
              />
            )}

            {stage === 'classifying' && (
              <div className="cl-glow-card rounded-[28px] border border-[var(--cl-border)] bg-surface p-6 shadow-1">
                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--cl-border)] bg-white/80 px-4 py-2 font-mono text-caption text-[var(--cl-text-secondary)]">
                  <Radar size={14} strokeWidth={1.5} className="text-navy-600" />
                  Reading regulations and building the profile...
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    mode === 'map' ? 'Reading selected place details' : 'Detecting jurisdictions',
                    'Extracting activities',
                    'Selecting follow-up logic',
                  ].map(item => (
                    <div key={item} className="rounded-2xl border border-[var(--cl-border-subtle)] bg-[var(--cl-sunken)] px-4 py-4 text-caption text-[var(--cl-text-secondary)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stage === 'followup' && activeFollowup && (
              <div className="rounded-[28px] border border-[var(--cl-border)] bg-surface p-6 shadow-1">
                <div className="mb-4 flex items-center gap-2 text-caption text-[var(--cl-text-muted)]">
                  <HelpCircle size={13} strokeWidth={1.5} />
                  <span>Follow-up {currentFollowup + 1} of {followupQueue.length}</span>
                  <span className="ml-auto font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="mb-6 h-2 overflow-hidden rounded-full bg-sunken">
                  <div className="h-full rounded-full bg-navy-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <h2 className="max-w-3xl text-h1 text-[var(--cl-text)]">{activeFollowup.question}</h2>
                <div className="mt-6 flex flex-col gap-3">
                  {activeFollowup.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleFollowupAnswer(option.value)}
                      className={cn(
                        'flex items-start gap-3 rounded-[22px] border border-[var(--cl-border)] bg-white px-4 py-4 text-left shadow-1 transition-colors duration-[80ms]',
                        'hover:border-navy-600 hover:bg-navy-50',
                      )}
                    >
                      <ChevronRight size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-navy-600" />
                      <div>
                        <p className="text-body font-semibold text-[var(--cl-text)]">{option.label}</p>
                        {option.detail && <p className="mt-1 text-caption text-[var(--cl-text-muted)]">{option.detail}</p>}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (currentFollowup + 1 < followupQueue.length) setCurrentFollowup(index => index + 1)
                    else setStage('review')
                  }}
                  className="mt-4 text-caption text-[var(--cl-text-muted)] underline hover:text-[var(--cl-text)]"
                >
                  Skip this question
                </button>
              </div>
            )}

            {stage === 'review' && profile && (
              <div className="rounded-[28px] border border-[var(--cl-border)] bg-surface p-6 shadow-1">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-label text-[var(--cl-text-muted)]">
                      {mode === 'map' ? 'Profile built from selected place' : 'Structured profile'}
                    </p>
                    <h2 className="mt-1 text-h2 text-[var(--cl-text)]">We read the business this way</h2>
                  </div>
                  <button
                    onClick={resetAnalysisState}
                    className="inline-flex items-center gap-1.5 text-caption text-navy-700 transition-colors hover:text-navy-600"
                  >
                    <Edit2 size={13} strokeWidth={1.5} />
                    Edit
                  </button>
                </div>

                <dl className="grid gap-3 md:grid-cols-2">
                  <KV k="industry" v={profile.industry} />
                  <KV k="location" v={profile.location} />
                  {profile.expansion_locations.length > 0 && <KV k="expansion" v={profile.expansion_locations.join(', ')} />}
                  {profile.activities.length > 0 && <KV k="activities" v={profile.activities.join(', ')} />}
                  {profile.employees !== null && <KV k="employees" v={String(profile.employees)} />}
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={handleConfirm} size="lg">
                    <CheckCircle size={15} strokeWidth={1.5} />
                    Looks right: analyze
                  </Button>
                  <Button variant="ghost" onClick={resetAnalysisState} size="lg">
                    {mode === 'map' ? 'Back to map' : 'Edit input'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-[var(--cl-border)] bg-navy-900 p-6 text-white shadow-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck size={18} strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-h2 text-white">Demo runway</h2>
            <p className="mt-2 text-body text-white/72">
              The intake now supports a real map-first branch. The selected Austin establishment is translated into AI-readable input before the app produces the final compliance profile.
            </p>
            <div className="mt-5 space-y-3">
              {RAIL_STEPS.map((step, index) => (
                <div key={step.title} className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="font-mono text-citation uppercase tracking-[0.14em] text-white/45">0{index + 1}</p>
                  <p className="mt-1 text-body font-semibold text-white">{step.title}</p>
                  <p className="mt-1 text-caption text-white/65">{step.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--cl-border)] bg-white/80 p-6 shadow-1">
            <p className="text-label text-[var(--cl-text-muted)]">Fastest text demo</p>
            <h3 className="mt-2 text-h3 text-[var(--cl-text)]">{EXAMPLE_SCENARIOS[0].label}</h3>
            <p className="mt-2 text-caption text-[var(--cl-text-secondary)]">{EXAMPLE_SCENARIOS[0].text}</p>
            <button
              type="button"
              onClick={handleDemoPreload}
              className="mt-4 inline-flex items-center gap-2 text-caption font-semibold text-navy-700 transition-colors hover:text-navy-600"
            >
              Launch text route
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </aside>
      </main>

      <DisclaimerBanner />
    </div>
  )
}

function AustinMapPicker({
  selectedBusiness,
  onSelectBusiness,
  onUseSelectedBusiness,
}: {
  selectedBusiness: AustinDemoBusiness | null
  onSelectBusiness: (businessId: string) => void
  onUseSelectedBusiness: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[var(--cl-border)] bg-surface p-5 shadow-1">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label text-[var(--cl-text-muted)]">Austin public business map</p>
            <h2 className="mt-1 text-h2 text-[var(--cl-text)]">Pick a demo business from the map</h2>
            <p className="mt-2 max-w-2xl text-body text-[var(--cl-text-secondary)]">
              Click a marker to select an established Austin business. The AI will use the picked place details as the intake input for the compliance run.
            </p>
          </div>
          <a
            href={getGoogleMapsSearchUrl(selectedBusiness?.googleMapsQuery ?? 'Austin TX restaurants')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-caption font-semibold text-navy-700 transition-colors hover:text-navy-600"
          >
            Open in Google Maps
            <ExternalLink size={13} strokeWidth={1.5} />
          </a>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[var(--cl-border)] bg-[var(--cl-sunken)] shadow-1">
          <AustinBusinessPickerMap
            businesses={AUSTIN_DEMO_BUSINESSES}
            selectedBusinessId={selectedBusiness?.id ?? null}
            onSelectBusiness={onSelectBusiness}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {AUSTIN_DEMO_BUSINESSES.map(business => {
          const isSelected = business.id === selectedBusiness?.id
          return (
            <button
              key={business.id}
              type="button"
              onClick={() => onSelectBusiness(business.id)}
              className={cn(
                'rounded-[24px] border bg-white px-4 py-4 text-left shadow-1 transition-colors duration-[80ms]',
                isSelected
                  ? 'border-navy-600 bg-navy-50'
                  : 'border-[var(--cl-border)] hover:border-[var(--cl-border-strong)] hover:bg-navy-50',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body font-semibold text-[var(--cl-text)]">{business.name}</p>
                  <p className="mt-1 text-caption text-navy-700">{business.category}</p>
                </div>
                {isSelected && (
                  <span className="rounded-full bg-navy-600 px-2.5 py-1 font-mono text-citation text-white">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-start gap-2 text-caption text-[var(--cl-text-secondary)]">
                <MapPin size={13} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--cl-text-muted)]" />
                <span>{business.address}</span>
              </div>
              <p className="mt-2 text-caption text-[var(--cl-text-muted)]">{business.neighborhood}</p>
              <p className="mt-3 text-caption text-[var(--cl-text-secondary)]">{business.blurb}</p>
            </button>
          )
        })}
      </div>

      <div className="rounded-[28px] border border-[var(--cl-border)] bg-surface p-5 shadow-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-label text-[var(--cl-text-muted)]">Selected business</p>
            {selectedBusiness ? (
              <>
                <h3 className="mt-1 text-h3 text-[var(--cl-text)]">{selectedBusiness.name}</h3>
                <p className="mt-2 max-w-2xl text-body text-[var(--cl-text-secondary)]">{selectedBusiness.scanSummary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ProfilePill label="Austin, TX" />
                  <ProfilePill label={selectedBusiness.category} />
                  <ProfilePill label={selectedBusiness.neighborhood} />
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-1 text-h3 text-[var(--cl-text)]">Nothing selected yet</h3>
                <p className="mt-2 max-w-2xl text-body text-[var(--cl-text-secondary)]">
                  Pick an Austin establishment from the map or the cards above, then run AI intake on that place.
                </p>
              </>
            )}
          </div>
          <Button size="lg" onClick={onUseSelectedBusiness} disabled={!selectedBusiness}>
            <CheckCircle size={15} strokeWidth={1.5} />
            Use picked place as AI input
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProfilePill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[var(--cl-border)] bg-white px-3 py-1 font-mono text-citation text-[var(--cl-text-secondary)]">
      {label}
    </span>
  )
}

function getGoogleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--cl-border)] bg-white px-4 py-4 shadow-1">
      <dt className="text-label text-[var(--cl-text-muted)]">{k}</dt>
      <dd className="mt-2 text-body text-[var(--cl-text)]">{v}</dd>
    </div>
  )
}
