'use client'

import { useEffect, useRef, useState } from 'react'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { api, type BusinessProfile, type SavedProfile } from '@/lib/api'
import { Bookmark, Trash2 } from 'lucide-react'

function getOrCreateClientId(): string {
  let id = localStorage.getItem('cl-clientId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('cl-clientId', id)
  }
  return id
}

export default function WatchlistPage() {
  const [clientId, setClientId] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<SavedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // "Save this scan" form state
  const [scanProfile, setScanProfile] = useState<BusinessProfile | null>(null)
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const deletingRef = useRef<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const id = getOrCreateClientId()
    setClientId(id)

    // Check for a scan in sessionStorage
    const rawProfile = sessionStorage.getItem('cl-profile')
    const rawInput = sessionStorage.getItem('cl-input')
    if (rawProfile && rawInput) {
      try {
        setScanProfile(JSON.parse(rawProfile) as BusinessProfile)
      } catch {
        // ignore malformed storage
      }
    }

    api.watchlist
      .list(id)
      .then((data) => {
        setProfiles(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load watchlist')
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    if (!clientId || !scanProfile || !label.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await api.watchlist.save({
        client_id: clientId,
        label: label.trim(),
        profile: scanProfile,
      })
      setProfiles((prev) => [saved, ...prev])
      setLabel('')
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!clientId || deletingRef.current.has(id)) return
    deletingRef.current.add(id)
    setDeletingIds(new Set(deletingRef.current))
    try {
      await api.watchlist.remove(id, clientId)
      setProfiles((prev) => prev.filter((p) => p.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile')
    } finally {
      deletingRef.current.delete(id)
      setDeletingIds(new Set(deletingRef.current))
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" />
      <DisclaimerBanner />

      <main className="flex-1 px-6 py-6 max-w-app mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-h1 text-[var(--cl-text)]">Watchlist</h1>
          <p className="text-caption text-[var(--cl-text-muted)] mt-1">
            Save business profiles and track them for regulatory changes.
          </p>
        </div>

        {/* Save this scan panel */}
        {scanProfile && (
          <div className="mb-6 bg-surface border border-[var(--cl-border)] rounded p-4 shadow-1">
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Save this scan
            </p>
            <p className="text-body text-[var(--cl-text-secondary)] mb-3">
              <span className="font-medium text-[var(--cl-text)]">{scanProfile.industry}</span>
              {' · '}
              {scanProfile.location}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (e.g. My Austin Restaurant)"
                maxLength={200}
                className="flex-1 bg-sunken border border-[var(--cl-border)] rounded text-body px-3 py-2 focus:outline-none focus:border-[var(--cl-border-strong)] text-[var(--cl-text)] placeholder:text-[var(--cl-text-muted)]"
              />
              <button
                onClick={handleSave}
                disabled={saving || !label.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-caption font-semibold bg-navy-600 text-white hover:bg-navy-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Bookmark size={14} strokeWidth={1.5} />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {saveError && (
              <p className="text-caption text-risk-high-fg mt-2">{saveError}</p>
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-4 bg-risk-high-bg border border-risk-high-border rounded px-4 py-3 text-body text-risk-high-fg">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-surface border border-[var(--cl-border)] rounded animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Profile list */}
        {!loading && profiles.length > 0 && (
          <div className="space-y-3">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="bg-surface border border-[var(--cl-border)] rounded shadow-1 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-h3 text-[var(--cl-text)] mb-0.5">{p.label}</h2>
                    <p className="text-caption text-[var(--cl-text-muted)] mb-2">
                      {p.profile_json.industry} · {p.profile_json.location}
                      {' · '}
                      Saved {new Date(p.created_at).toLocaleDateString()}
                    </p>
                    {p.profile_json.activities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.profile_json.activities.slice(0, 6).map((act) => (
                          <span
                            key={act}
                            className="font-mono text-citation px-2 py-0.5 rounded-sm border border-[var(--cl-border)] text-[var(--cl-text-secondary)] bg-sunken"
                          >
                            {act}
                          </span>
                        ))}
                        {p.profile_json.activities.length > 6 && (
                          <span className="font-mono text-citation text-[var(--cl-text-muted)]">
                            +{p.profile_json.activities.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingIds.has(p.id)}
                    aria-label={`Delete ${p.label}`}
                    className="shrink-0 p-1.5 rounded text-[var(--cl-text-muted)] hover:text-risk-high-fg hover:bg-risk-high-bg transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && profiles.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Bookmark size={32} strokeWidth={1.5} className="text-[var(--cl-text-muted)]" />
            <p className="text-h2 text-[var(--cl-text)]">No saved profiles yet</p>
            <p className="text-body text-[var(--cl-text-muted)]">
              Run a scan and save it here to track regulatory changes.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
