'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api, type RiskFinding, type RiskAnalysisResult } from '@/lib/api'
import {
  Circle, Clock, Send, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, FileText, Calendar, ExternalLink, Printer,
} from 'lucide-react'

type TaskStatus = 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'blocked'

interface TaskState {
  status: TaskStatus
  deadline?: string
  notes?: string
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  not_started: { label: 'Not started',  icon: <Circle size={14} strokeWidth={1.5} />,         classes: 'text-[var(--cl-text-muted)] bg-sunken border-[var(--cl-border)]' },
  in_progress:  { label: 'In progress',  icon: <Clock size={14} strokeWidth={1.5} />,           classes: 'text-risk-med-fg bg-risk-med-bg border-risk-med-border' },
  submitted:    { label: 'Submitted',    icon: <Send size={14} strokeWidth={1.5} />,             classes: 'text-navy-600 bg-navy-50 border-[var(--cl-border)]' },
  approved:     { label: 'Approved',     icon: <CheckCircle2 size={14} strokeWidth={1.5} />,     classes: 'text-risk-low-fg bg-risk-low-bg border-risk-low-border' },
  blocked:      { label: 'Blocked',      icon: <XCircle size={14} strokeWidth={1.5} />,          classes: 'text-risk-high-fg bg-risk-high-bg border-risk-high-border' },
}

const STATUS_ORDER: TaskStatus[] = ['not_started', 'in_progress', 'submitted', 'approved', 'blocked']

function taskKey(finding: RiskFinding) {
  return `cl-task-${finding.affected_area.replace(/\s+/g, '-').toLowerCase()}`
}

function loadTasks(findings: RiskFinding[]): Record<string, TaskState> {
  const stored: Record<string, TaskState> = {}
  findings.forEach(f => {
    const key = taskKey(f)
    const raw = localStorage.getItem(key)
    stored[key] = raw ? JSON.parse(raw) : { status: 'not_started' }
  })
  return stored
}

export default function ChecklistPage() {
  const router = useRouter()
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)
  const [tasks, setTasks] = useState<Record<string, TaskState>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    const json = sessionStorage.getItem('cl-risk-result')
    if (!json) {
      api.getDemoRisk()
        .then(data => { setResult(data); setTasks(loadTasks(data.findings)); setIsDemo(true) })
        .catch(() => router.push('/intake'))
      return
    }
    const r: RiskAnalysisResult = JSON.parse(json)
    setResult(r)
    setTasks(loadTasks(r.findings))
  }, [router])

  function updateTask(key: string, patch: Partial<TaskState>) {
    setTasks(prev => {
      const updated = { ...prev, [key]: { ...prev[key], ...patch } }
      localStorage.setItem(key, JSON.stringify(updated[key]))
      return updated
    })
  }

  function cycleStatus(key: string, current: TaskStatus) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    updateTask(key, { status: next })
  }

  function toggleExpand(key: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (!result) return null

  const findings = result.findings
  const approvedCount = findings.filter(f => tasks[taskKey(f)]?.status === 'approved').length
  const progress = findings.length > 0 ? Math.round((approvedCount / findings.length) * 100) : 0

  const isDeadlineSoon = (deadline?: string) => {
    if (!deadline) return false
    const days = (new Date(deadline).getTime() - Date.now()) / 86400000
    return days >= 0 && days <= 7
  }

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline).getTime() < Date.now()
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" onCompare={() => router.push('/diff')} />
      <DisclaimerBanner />
      {isDemo && (
        <div className="bg-risk-med-bg border-b border-risk-med-border px-6 py-2 flex items-center gap-2 text-caption text-risk-med-fg">
          <AlertTriangle size={13} strokeWidth={1.5} className="shrink-0" />
          Showing demo data.
          <button onClick={() => router.push('/intake')} className="underline ml-1">Run a real scan</button> to see your results.
        </div>
      )}

      <main className="flex-1 px-6 py-6 max-w-app mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 no-print">
          <div>
            <h1 className="text-h1 text-[var(--cl-text)]">Compliance Checklist</h1>
            <p className="text-caption text-[var(--cl-text-muted)] mt-1">
              {approvedCount} of {findings.length} requirements approved · {progress}% complete
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-caption text-[var(--cl-text-secondary)] border border-[var(--cl-border)] bg-surface rounded px-3 py-1.5 hover:bg-navy-50 transition-colors"
          >
            <Printer size={14} strokeWidth={1.5} /> Print
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6 no-print">
          <div className="h-2 bg-sunken rounded-full overflow-hidden border border-[var(--cl-border-subtle)]">
            <div
              className="h-full bg-navy-600 rounded-full transition-all duration-[320ms]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {findings.map((finding) => {
            const key = taskKey(finding)
            const state = tasks[key] ?? { status: 'not_started' }
            const cfg = STATUS_CONFIG[state.status]
            const isExp = expanded.has(key)
            const soon = isDeadlineSoon(state.deadline)
            const overdue = isOverdue(state.deadline)

            return (
              <div
                key={key}
                className={cn(
                  'bg-surface border rounded shadow-1',
                  state.status === 'approved'
                    ? 'border-risk-low-border'
                    : state.status === 'blocked'
                    ? 'border-risk-high-border'
                    : 'border-[var(--cl-border)]',
                )}
              >
                {/* Task header */}
                <div className="flex items-start gap-3 p-4">
                  {/* Status toggle */}
                  <button
                    onClick={() => cycleStatus(key, state.status)}
                    title={`Status: ${cfg.label}, click to advance`}
                    aria-label={`Status: ${cfg.label}. Click to advance task status.`}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-sm border text-caption font-mono shrink-0 transition-colors duration-[80ms] hover:opacity-80 cursor-pointer',
                      cfg.classes,
                    )}
                  >
                    {cfg.icon}
                    <span className="hidden sm:inline">{cfg.label}</span>
                    <span className="hidden md:inline text-[10px] uppercase tracking-[0.06em] opacity-70">
                      Change
                    </span>
                    <ChevronDown size={12} strokeWidth={1.5} className="opacity-70" />
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <RiskBadge level={finding.risk_level} />
                      <h3 className={cn(
                        'text-h3 text-[var(--cl-text)]',
                        state.status === 'approved' && 'line-through text-[var(--cl-text-muted)]',
                      )}>
                        {finding.affected_area}
                      </h3>
                    </div>
                    <p className="text-body text-[var(--cl-text-secondary)] line-clamp-2">{finding.explanation}</p>

                    {/* Deadline row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} strokeWidth={1.5} className="text-[var(--cl-text-muted)]" />
                        <input
                          type="date"
                          value={state.deadline ?? ''}
                          onChange={e => updateTask(key, { deadline: e.target.value || undefined })}
                          className="text-citation font-mono bg-transparent border-b border-[var(--cl-border)] text-[var(--cl-text-secondary)] focus:outline-none focus:border-navy-600"
                        />
                      </div>
                      {(soon || overdue) && state.status !== 'approved' && (
                        <span className={cn(
                          'font-mono text-citation px-2 py-0.5 rounded-sm border',
                          overdue ? 'text-risk-high-fg bg-risk-high-bg border-risk-high-border'
                                  : 'text-risk-med-fg bg-risk-med-bg border-risk-med-border',
                        )}>
                          <AlertTriangle size={10} strokeWidth={1.5} className="inline mr-1" />
                          {overdue ? 'Overdue' : 'Due soon'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button onClick={() => toggleExpand(key)} className="text-[var(--cl-text-muted)] hover:text-[var(--cl-text)] shrink-0 mt-1">
                    {isExp ? <ChevronDown size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} />}
                  </button>
                </div>

                {/* Expanded details */}
                {isExp && (
                  <div className="px-4 pb-4 pt-0 border-t border-[var(--cl-border-subtle)] space-y-4">
                    {/* Recommended action */}
                    <div>
                      <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Next step</p>
                      <p className="text-body text-[var(--cl-text)]">{finding.recommended_action}</p>
                    </div>

                    {/* Documents needed */}
                    {finding.documents_needed && finding.documents_needed.length > 0 && (
                      <div>
                        <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-2">Documents needed</p>
                        <ul className="space-y-1">
                          {finding.documents_needed.map((doc, i) => (
                            <li key={i} className="flex items-start gap-2 text-body text-[var(--cl-text-secondary)]">
                              <FileText size={13} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--cl-text-muted)]" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Who to contact */}
                    {finding.who_to_contact && (
                      <div>
                        <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Contact</p>
                        <p className="text-body text-[var(--cl-text)]">{finding.who_to_contact}</p>
                        {finding.what_to_ask && (
                          <p className="text-caption text-[var(--cl-text-muted)] mt-0.5 italic">Ask: {finding.what_to_ask}</p>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Notes</p>
                      <textarea
                        value={state.notes ?? ''}
                        onChange={e => updateTask(key, { notes: e.target.value || undefined })}
                        placeholder="Add notes..."
                        rows={2}
                        className="w-full bg-sunken border border-[var(--cl-border)] rounded text-body px-3 py-2 resize-none focus:outline-none focus:border-[var(--cl-border-strong)] text-[var(--cl-text)] placeholder:text-[var(--cl-text-muted)]"
                      />
                    </div>

                    {/* Source + status actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={finding.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-citation text-navy-600 hover:underline"
                      >
                        View source <ExternalLink size={11} strokeWidth={1.5} />
                      </a>
                      <div className="flex gap-1 ml-auto">
                        {STATUS_ORDER.map(s => (
                          <button
                            key={s}
                            onClick={() => updateTask(key, { status: s })}
                            title={STATUS_CONFIG[s].label}
                            className={cn(
                              'px-2 py-0.5 rounded-sm border text-caption transition-colors duration-[80ms]',
                              state.status === s
                                ? STATUS_CONFIG[s].classes + ' font-semibold'
                                : 'text-[var(--cl-text-muted)] bg-surface border-[var(--cl-border)] hover:bg-navy-50',
                            )}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {findings.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CheckCircle2 size={32} strokeWidth={1.5} className="text-risk-low-fg" />
            <p className="text-h2 text-[var(--cl-text)]">No compliance tasks found.</p>
            <Button variant="secondary" onClick={() => router.push('/intake')}>Run a new scan</Button>
          </div>
        )}
      </main>
    </div>
  )
}
