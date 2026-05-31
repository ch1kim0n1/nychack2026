'use client'

import { useEffect, useState } from 'react'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { CitationChip } from '@/components/ui/citation-chip'
import { Skeleton } from '@/components/ui/skeleton'
import { api, type ScenarioDiff, type DiffItem } from '@/lib/api'
import { Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

const SCENARIOS = [
  { id: 'scenario-a', label: 'Food truck → Austin restaurant' },
  { id: 'scenario-b', label: 'Salon → Nail + waxing' },
  { id: 'scenario-c', label: 'Retail → E-commerce' },
]

const STATUS_CONFIG = {
  new:     { label: 'NEW',     classes: 'text-risk-high-fg bg-risk-high-bg border-risk-high-border' },
  changed: { label: 'CHANGED', classes: 'text-risk-med-fg bg-risk-med-bg border-risk-med-border' },
  same:    { label: 'SAME',    classes: 'text-[var(--cl-text-muted)] bg-sunken border-[var(--cl-border)]' },
}

export default function DiffPage() {
  const [activeScenario, setActiveScenario] = useState('scenario-a')
  const [diff, setDiff] = useState<ScenarioDiff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.getDiff(activeScenario)
      .then(setDiff)
      .catch(() => setError('Could not load comparison data.'))
      .finally(() => setLoading(false))
  }, [activeScenario])

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" />
      <DisclaimerBanner />

      <main className="flex-1 px-6 py-6 max-w-app mx-auto w-full">
        {/* Header + scenario switcher */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-h1 text-[var(--cl-text)]">
              {diff?.title ?? 'Regulatory Comparison'}
            </h1>
            {diff && (
              <p className="text-caption text-[var(--cl-text-muted)] mt-1 font-mono">
                {diff.city_a} → {diff.city_b}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap no-print">
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveScenario(s.id)}
                className={cn(
                  'px-3 py-1.5 rounded text-caption border transition-colors duration-[80ms]',
                  activeScenario === s.id
                    ? 'bg-navy-600 text-white border-navy-700'
                    : 'bg-surface text-[var(--cl-text-secondary)] border-[var(--cl-border)] hover:bg-navy-50',
                )}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-caption text-[var(--cl-text-secondary)] border border-[var(--cl-border)] bg-surface rounded px-3 py-1.5 hover:bg-navy-50 transition-colors"
            >
              <Printer size={14} strokeWidth={1.5} />
              Print / Save
            </button>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
          </div>
        )}

        {error && (
          <p className="text-body text-risk-high-fg bg-risk-high-bg border border-risk-high-border rounded p-4">
            {error}
          </p>
        )}

        {diff && !loading && (
          <>
            {/* Legend */}
            <div className="flex items-center gap-3 mb-4 no-print">
              <span className="text-label uppercase text-[var(--cl-text-muted)] tracking-[0.06em]">Legend:</span>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <span key={key} className={cn('font-mono text-citation px-2 py-0.5 rounded-sm border', cfg.classes)}>
                  {cfg.label}
                </span>
              ))}
            </div>

            {/* Diff table */}
            <div className="overflow-x-auto border border-[var(--cl-border)] rounded shadow-1">
              <table className="w-full text-body border-collapse">
                <thead>
                  <tr className="bg-navy-800 text-white">
                    <th className="text-left px-4 py-2.5 text-label uppercase tracking-[0.06em] w-1/4">Requirement</th>
                    <th className="text-left px-4 py-2.5 text-label uppercase tracking-[0.06em] w-[30%]">{diff.city_a}</th>
                    <th className="text-left px-4 py-2.5 text-label uppercase tracking-[0.06em] w-[30%]">{diff.city_b}</th>
                    <th className="text-left px-4 py-2.5 text-label uppercase tracking-[0.06em] w-16">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.differences.map((row, i) => (
                    <DiffRow key={i} row={row} index={i} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Print-only footnotes */}
            <div className="hidden print-expand mt-6 text-caption text-[var(--cl-text-muted)]">
              <p className="font-semibold mb-2">Sources</p>
              {diff.differences.flatMap((row, i) => {
                const notes = []
                if (row.source_a) notes.push(<p key={`${i}-a`}>[{i + 1}a] {row.source_a}</p>)
                if (row.source_b) notes.push(<p key={`${i}-b`}>[{i + 1}b] {row.source_b}</p>)
                return notes
              })}
              <p className="mt-3">Informational guidance, not legal advice. — CivicLens</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function DiffRow({ row, index }: { row: DiffItem; index: number }) {
  const cfg = STATUS_CONFIG[row.status]
  return (
    <tr className={cn(
      'border-t border-[var(--cl-border-subtle)]',
      index % 2 === 1 && 'bg-canvas',
      'hover:bg-navy-50 transition-colors duration-[120ms]',
    )}>
      <td className="px-4 py-3 font-semibold text-body text-[var(--cl-text)] align-top">{row.category}</td>
      <td className="px-4 py-3 text-body text-[var(--cl-text-secondary)] align-top">
        {row.dallas ?? <span className="text-[var(--cl-text-muted)] italic">N/A</span>}
        {row.source_a && <div className="mt-1.5"><CitationChip url={row.source_a} /></div>}
      </td>
      <td className="px-4 py-3 text-body text-[var(--cl-text-secondary)] align-top">
        {row.austin ?? <span className="text-[var(--cl-text-muted)] italic">N/A</span>}
        {row.source_b && <div className="mt-1.5"><CitationChip url={row.source_b} /></div>}
      </td>
      <td className="px-4 py-3 align-top">
        <span className={cn('inline-block font-mono text-citation px-2 py-0.5 rounded-sm border whitespace-nowrap', cfg.classes)}>
          {cfg.label}
        </span>
      </td>
    </tr>
  )
}
