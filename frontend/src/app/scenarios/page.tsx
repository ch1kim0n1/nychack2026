'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const INDUSTRIES = [
  { value: 'food_service',  label: 'Food service / restaurant / food truck' },
  { value: 'cosmetology',   label: 'Salon / cosmetology' },
  { value: 'retail',        label: 'Retail / e-commerce' },
  { value: 'construction',  label: 'Construction / contracting' },
  { value: 'childcare',     label: 'Childcare / daycare' },
]

const ACTIVITIES = [
  { value: 'alcohol_planned',  label: 'Add alcohol service (TABC)' },
  { value: 'outdoor_seating',  label: 'Add outdoor seating / patio' },
  { value: 'food_preparation', label: 'Add food preparation' },
  { value: 'nail_services',    label: 'Add nail services' },
  { value: 'delivery',         label: 'Add delivery' },
  { value: 'hiring_employees', label: 'Hire first employees' },
  { value: 'second_location',  label: 'Open a second location' },
  { value: 'renovation',       label: 'Major renovation / build-out' },
]

const TEXAS_CITIES = [
  'Dallas, TX', 'Austin, TX', 'Houston, TX', 'San Antonio, TX',
  'Fort Worth, TX', 'El Paso, TX', 'Arlington, TX', 'Plano, TX',
]

// Map user selections to the pre-validated scenario IDs
function selectScenario(
  industry: string,
  newActivities: string[],
  expandingCity: string | null,
): string | null {
  if (industry === 'food_service' && expandingCity === 'Austin, TX') return 'scenario-a'
  if (industry === 'cosmetology' && (newActivities.includes('nail_services') || newActivities.length > 0)) return 'scenario-b'
  if (industry === 'retail' && newActivities.includes('delivery')) return 'scenario-c'
  // Default to best match
  if (industry === 'food_service') return 'scenario-a'
  if (industry === 'cosmetology') return 'scenario-b'
  if (industry === 'retail') return 'scenario-c'
  return null
}

export default function ScenariosPage() {
  const router = useRouter()
  const [industry, setIndustry] = useState('')
  const [currentCity, setCurrentCity] = useState('')
  const [expandCity, setExpandCity] = useState('')
  const [activities, setActivities] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  function toggleActivity(val: string) {
    setActivities(prev => prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val])
  }

  function handleBuild() {
    setSubmitted(true)
    const scenario = selectScenario(industry, activities, expandCity || null)

    // Store as a profile for the intake path, or go directly to diff
    if (scenario) {
      router.push(`/diff?scenario=${scenario}`)
    } else {
      // Fall back to intake with a pre-filled description
      const desc = [
        currentCity && `I run a ${industry.replace(/_/g, ' ')} business in ${currentCity}.`,
        expandCity && `I want to expand to ${expandCity}.`,
        activities.length > 0 && `I also plan to: ${activities.map(a => a.replace(/_/g, ' ')).join(', ')}.`,
      ].filter(Boolean).join(' ')

      sessionStorage.setItem('cl-prefill', desc)
      router.push('/intake')
    }
  }

  const canBuild = industry.length > 0

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" />
      <DisclaimerBanner />

      <main className="flex-1 px-6 py-8 max-w-[800px] mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-h1 text-[var(--cl-text)] mb-1">Expansion Scenario Builder</h1>
          <p className="text-body text-[var(--cl-text-secondary)]">
            Model a &ldquo;what if&rdquo; scenario and see the regulatory difference instantly.
          </p>
        </div>

        <div className="space-y-6">
          {/* Industry */}
          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              What type of business? <span className="text-risk-high-fg">*</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind.value}
                  onClick={() => setIndustry(ind.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded border text-body text-left transition-colors duration-[80ms]',
                    industry === ind.value
                      ? 'bg-navy-600 text-white border-navy-700'
                      : 'bg-surface text-[var(--cl-text)] border-[var(--cl-border)] hover:bg-navy-50',
                  )}
                >
                  {ind.label}
                </button>
              ))}
            </div>
          </section>

          {/* Current city */}
          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Where are you currently located?
            </p>
            <div className="flex flex-wrap gap-2">
              {TEXAS_CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => setCurrentCity(city === currentCity ? '' : city)}
                  className={cn(
                    'px-3 py-1.5 rounded-sm border text-body transition-colors duration-[80ms]',
                    currentCity === city
                      ? 'bg-navy-600 text-white border-navy-700'
                      : 'bg-surface text-[var(--cl-text-secondary)] border-[var(--cl-border)] hover:bg-navy-50',
                  )}
                >
                  {city.replace(', TX', '')}
                </button>
              ))}
            </div>
          </section>

          {/* Expansion city */}
          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Where do you want to expand or add a location?
            </p>
            <div className="flex flex-wrap gap-2">
              {TEXAS_CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => setExpandCity(city === expandCity ? '' : city)}
                  disabled={city === currentCity}
                  className={cn(
                    'px-3 py-1.5 rounded-sm border text-body transition-colors duration-[80ms]',
                    expandCity === city
                      ? 'bg-navy-600 text-white border-navy-700'
                      : 'bg-surface text-[var(--cl-text-secondary)] border-[var(--cl-border)] hover:bg-navy-50',
                    city === currentCity && 'opacity-40 pointer-events-none',
                  )}
                >
                  {city.replace(', TX', '')}
                </button>
              ))}
            </div>
          </section>

          {/* New activities */}
          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              What are you adding or changing?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACTIVITIES.map(act => (
                <button
                  key={act.value}
                  onClick={() => toggleActivity(act.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded border text-body text-left transition-colors duration-[80ms]',
                    activities.includes(act.value)
                      ? 'bg-navy-100 text-navy-800 border-navy-600'
                      : 'bg-surface text-[var(--cl-text-secondary)] border-[var(--cl-border)] hover:bg-navy-50',
                  )}
                >
                  <span className={cn(
                    'w-4 h-4 rounded-sm border flex-shrink-0 flex items-center justify-center text-caption',
                    activities.includes(act.value) ? 'bg-navy-600 border-navy-700 text-white' : 'border-[var(--cl-border)]',
                  )}>
                    {activities.includes(act.value) && '✓'}
                  </span>
                  {act.label}
                </button>
              ))}
            </div>
          </section>

          {/* Scenario preview */}
          {industry && (
            <div className="bg-navy-50 border border-[var(--cl-border)] rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} strokeWidth={1.5} className="text-navy-600" />
                <p className="text-caption font-semibold text-navy-700">
                  Scenario match: {selectScenario(industry, activities, expandCity || null) ?? 'Custom: will run full analysis'}
                </p>
              </div>
              <p className="text-caption text-[var(--cl-text-secondary)]">
                {currentCity && expandCity
                  ? `Comparing requirements: ${currentCity} → ${expandCity}`
                  : currentCity
                  ? `Current location: ${currentCity}`
                  : expandCity
                  ? `Expansion target: ${expandCity}`
                  : `Industry: ${industry.replace(/_/g, ' ')}`}
                {activities.length > 0 && ` · Adding: ${activities.map(a => a.replace(/_/g, ' ')).join(', ')}`}
              </p>
            </div>
          )}

          <Button
            size="lg"
            disabled={!canBuild || submitted}
            loading={submitted}
            onClick={handleBuild}
          >
            See the regulatory difference <ArrowRight size={16} />
          </Button>
        </div>
      </main>
    </div>
  )
}
