'use client'

import { useEffect, useState } from 'react'
import { api, type AdminFinding, type ReviewStats } from '@/lib/api'

export default function AdminPage() {
  const [findings, setFindings] = useState<AdminFinding[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [reviewing, setReviewing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [pending, statsData] = await Promise.all([
        api.getAdminPendingFindings(),
        api.getAdminStats(),
      ])
      setFindings(pending)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(id: string, state: 'approved' | 'rejected') {
    setReviewing(prev => ({ ...prev, [id]: true }))
    try {
      await api.reviewFinding(id, state, notes[id] || undefined)
      setFindings(prev => prev.filter(f => f.id !== id))
      // Refresh stats
      const updated = await api.getAdminStats()
      setStats(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Review action failed')
    } finally {
      setReviewing(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          CivicLens — Internal Admin Review
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          High-risk category findings requiring approval before public display.
          Internal use only — not linked from the main nav.
        </p>

        {/* Stats Banner */}
        {stats && (
          <div className="flex gap-4 mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <StatPill label="Pending" value={stats.pending} color="amber" />
            <StatPill label="Approved" value={stats.approved} color="green" />
            <StatPill label="Rejected" value={stats.rejected} color="red" />
            <StatPill label="Auto-approved" value={stats.auto_approved} color="gray" />
          </div>
        )}

        {/* Loading / Error */}
        {loading && (
          <p className="text-gray-500 text-sm">Loading pending findings…</p>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800 text-sm mb-4">
            {error}
            <button className="ml-3 underline" onClick={() => void loadData()}>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && findings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">&#10003;</p>
            <p className="text-gray-600 font-medium">
              All high-risk findings have been reviewed.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              No pending items in the queue.
            </p>
          </div>
        )}

        {/* Findings List */}
        {!loading && findings.length > 0 && (
          <div className="space-y-4">
            {findings.map(finding => (
              <FindingCard
                key={finding.id}
                finding={finding}
                note={notes[finding.id] ?? ''}
                onNoteChange={value =>
                  setNotes(prev => ({ ...prev, [finding.id]: value }))
                }
                onApprove={() => void handleReview(finding.id, 'approved')}
                onReject={() => void handleReview(finding.id, 'rejected')}
                isReviewing={reviewing[finding.id] ?? false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'amber' | 'green' | 'red' | 'gray'
}) {
  const colorMap = {
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  }
  return (
    <div
      className={`flex flex-col items-center px-4 py-2 rounded border text-sm font-mono ${colorMap[color]}`}
    >
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  )
}

function FindingCard({
  finding,
  note,
  onNoteChange,
  onApprove,
  onReject,
  isReviewing,
}: {
  finding: AdminFinding
  note: string
  onNoteChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  isReviewing: boolean
}) {
  const riskColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-mono border shrink-0 ${riskColors[finding.risk_level]}`}
          >
            {finding.risk_level.toUpperCase()}
          </span>
          <h2 className="text-base font-semibold text-gray-900 break-words">
            {finding.affected_area}
          </h2>
        </div>
        {finding.confidence_level && (
          <span className="text-xs text-gray-500 shrink-0 font-mono">
            confidence: {finding.confidence_level}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-700 mb-3 line-clamp-3">
        {finding.explanation}
      </p>

      {finding.source_url && (
        <a
          href={finding.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline break-all block mb-4"
        >
          {finding.source_url}
        </a>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          type="text"
          placeholder="Optional reviewer note…"
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={isReviewing}
        />
        <button
          onClick={onApprove}
          disabled={isReviewing}
          className="px-4 py-1.5 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isReviewing ? 'Saving…' : 'Approve'}
        </button>
        <button
          onClick={onReject}
          disabled={isReviewing}
          className="px-4 py-1.5 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isReviewing ? 'Saving…' : 'Reject'}
        </button>
      </div>
    </div>
  )
}
