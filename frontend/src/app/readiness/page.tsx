'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type RiskAnalysisResult, type RiskFinding } from '@/lib/api'
import { CheckCircle2, Circle, AlertTriangle, Rocket, Printer } from 'lucide-react'

// Opening-Day Readiness (11.6) + Compliance Gap Analyzer (9.9):
// reads checklist task states from localStorage, computes done-vs-remaining,
// produces a single go/no-go readiness score.

type TaskStatus = 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'blocked'

function taskKey(f: RiskFinding) {
  return `cl-task-${f.affected_area.replace(/\s+/g, '-').toLowerCase()}`
}

function readStatus(f: RiskFinding): TaskStatus {
  if (typeof window === 'undefined') return 'not_started'
  const raw = localStorage.getItem(taskKey(f))
  if (!raw) return 'not_started'
  try { return (JSON.parse(raw).status as TaskStatus) ?? 'not_started' } catch { return 'not_started' }
}

const DONE: TaskStatus[] = ['approved']

export default function ReadinessPage() {
  const router = useRouter()
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>({})

  useEffect(() => {
    const json = sessionStorage.getItem('cl-risk-result')
    if (!json) { router.push('/intake'); return }
    const r: RiskAnalysisResult = JSON.parse(json)
    setResult(r)
    const map: Record<string, TaskStatus> = {}
    r.findings.forEach(f => { map[taskKey(f)] = readStatus(f) })
    setStatuses(map)
  }, [router])

  if (!result) return null

  const findings = result.findings
  const blocking = findings.filter(f => f.risk_level === 'high')
  const doneCount = findings.filter(f => DONE.includes(statuses[taskKey(f)])).length
  const blockingDone = blocking.filter(f => DONE.includes(statuses[taskKey(f)])).length
  const blockingRemaining = blocking.length - blockingDone

  const readinessScore = findings.length === 0 ? 100 : Math.round((doneCount / findings.length) * 100)
  const goNoGo = blockingRemaining === 0 ? 'GO' : 'NOT READY'

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" onCompare={() => router.push('/diff')} />
      <DisclaimerBanner />

      <main className="flex-1 px-6 py-6 max-w-[840px] mx-auto w-full">
        <div className="flex items-start justify-between mb-6 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-navy-50 border border-[var(--cl-border)] text-navy-600">
              <Rocket size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-h1 text-[var(--cl-text)]">Opening-Day Readiness</h1>
              <p className="text-caption text-[var(--cl-text-muted)]">
                Based on what you&apos;ve marked complete in your checklist.
              </p>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-caption text-[var(--cl-text-secondary)] border border-[var(--cl-border)] bg-surface rounded px-3 py-1.5 hover:bg-navy-50 transition-colors">
            <Printer size={14} strokeWidth={1.5} /> Print
          </button>
        </div>

        {/* Go / No-Go banner */}
        <div className={cn(
          'flex items-center gap-4 rounded border p-5 mb-6',
          goNoGo === 'GO' ? 'border-risk-low-border bg-risk-low-bg' : 'border-risk-high-border bg-risk-high-bg',
        )}>
          <div className={cn(
            'text-display font-mono font-semibold',
            goNoGo === 'GO' ? 'text-risk-low-fg' : 'text-risk-high-fg',
          )}>
            {readinessScore}%
          </div>
          <div>
            <p className={cn('text-h2', goNoGo === 'GO' ? 'text-risk-low-fg' : 'text-risk-high-fg')}>
              {goNoGo === 'GO' ? 'Ready to open' : 'Not ready to open'}
            </p>
            <p className="text-body text-[var(--cl-text-secondary)]">
              {goNoGo === 'GO'
                ? 'All blocking (high-risk) requirements are approved.'
                : `${blockingRemaining} blocking requirement${blockingRemaining === 1 ? '' : 's'} still outstanding.`}
            </p>
          </div>
        </div>

        {/* Gap analysis: two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Remaining */}
          <div>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Still to do ({findings.length - doneCount})
            </p>
            <div className="space-y-2">
              {findings.filter(f => !DONE.includes(statuses[taskKey(f)])).map((f, i) => (
                <div key={i} className="flex items-start gap-2 bg-surface border border-[var(--cl-border)] rounded p-3">
                  <Circle size={15} strokeWidth={1.5} className="text-[var(--cl-text-muted)] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <RiskBadge level={f.risk_level} />
                      <span className="text-body font-semibold text-[var(--cl-text)]">{f.affected_area}</span>
                    </div>
                    {f.risk_level === 'high' && (
                      <span className="inline-flex items-center gap-1 text-citation text-risk-high-fg mt-1">
                        <AlertTriangle size={11} strokeWidth={1.5} /> Blocks opening
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {findings.length - doneCount === 0 && (
                <p className="text-body text-[var(--cl-text-muted)] italic">Nothing remaining — all approved.</p>
              )}
            </div>
          </div>

          {/* Done */}
          <div>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Completed ({doneCount})
            </p>
            <div className="space-y-2">
              {findings.filter(f => DONE.includes(statuses[taskKey(f)])).map((f, i) => (
                <div key={i} className="flex items-start gap-2 bg-risk-low-bg border border-risk-low-border rounded p-3">
                  <CheckCircle2 size={15} strokeWidth={1.5} className="text-risk-low-fg shrink-0 mt-0.5" />
                  <span className="text-body text-[var(--cl-text-secondary)] line-through">{f.affected_area}</span>
                </div>
              ))}
              {doneCount === 0 && (
                <p className="text-body text-[var(--cl-text-muted)] italic">
                  Nothing marked approved yet. <button onClick={() => router.push('/checklist')} className="text-navy-600 underline">Open checklist</button>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3 no-print">
          <Button onClick={() => router.push('/checklist')}>Update checklist</Button>
          <Button variant="secondary" onClick={() => router.push('/report')}>Full report</Button>
        </div>
      </main>
    </div>
  )
}
