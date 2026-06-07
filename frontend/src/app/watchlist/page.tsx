'use client'

import { useEffect, useRef, useState } from 'react'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'
import { api, type BusinessProfile, type SavedProfile } from '@/lib/api'
import { Bookmark, Trash2, Bell, Building2 } from 'lucide-react'

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

  const [scanProfile, setScanProfile] = useState<BusinessProfile | null>(null)
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const deletingRef = useRef<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const id = getOrCreateClientId()
    setClientId(id)

    const rawProfile = sessionStorage.getItem('cl-profile')
    const rawInput = sessionStorage.getItem('cl-input')
    if (rawProfile && rawInput) {
      try {
        setScanProfile(JSON.parse(rawProfile) as BusinessProfile)
      } catch {
        // Ignore malformed storage.
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
      setProfiles((prev) => prev.filter((profile) => profile.id !== id))
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

      <main className="flex-1 px-6 py-8 max-w-app mx-auto w-full">
        <div className="mb-6 overflow-hidden rounded-lg border border-[var(--cl-border)] bg-surface shadow-1">
          <div className="grid lg:grid-cols-[280px_1fr]">
            <div className="bg-navy-900 px-6 py-5 text-white">
              <div className="mb-4 flex items-center gap-2 text-white/75">
                <Bell size={18} strokeWidth={1.5} />
                <span className="text-label uppercase tracking-[0.06em]">Watchlist</span>
              </div>
              <h1 className="text-h1 text-white">Track civic risk across saved profiles.</h1>
            </div>
            <div className="px-6 py-5">
              <p className="text-body-lg text-[var(--cl-text)]">
                Save business profiles and monitor them as local rules, permits, and agency sources change.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="border-l-2 border-navy-600 pl-3">
                  <p className="font-mono text-h2 text-[var(--cl-text)]">{profiles.length}</p>
                  <p className="text-caption text-[var(--cl-text-muted)]">Saved profiles</p>
                </div>
                <div className="border-l-2 border-[var(--cl-border-strong)] pl-3">
                  <p className="font-mono text-h2 text-[var(--cl-text)]">{scanProfile ? '1' : '0'}</p>
                  <p className="text-caption text-[var(--cl-text-muted)]">Current scans ready to save</p>
                </div>
                <div className="border-l-2 border-risk-low-border pl-3">
                  <p className="font-mono text-h2 text-[var(--cl-text)]">30d</p>
                  <p className="text-caption text-[var(--cl-text-muted)]">Radar comparison window</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {scanProfile && (
          <section className="mb-6 rounded-lg border border-[var(--cl-border)] bg-surface p-5 shadow-1">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Save this scan</p>
                <p className="text-body text-[var(--cl-text-secondary)]">
                  <span className="font-medium text-[var(--cl-text)]">{scanProfile.industry}</span>
                  {' · '}
                  {scanProfile.location}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label, for example My Austin Restaurant"
                maxLength={200}
                className="flex-1 rounded border border-[var(--cl-border)] bg-sunken px-3 py-2 text-body text-[var(--cl-text)] placeholder:text-[var(--cl-text-muted)] focus:outline-none focus:border-[var(--cl-border-strong)]"
              />
              <button
                onClick={handleSave}
                disabled={saving || !label.trim()}
                className="flex items-center justify-center gap-1.5 rounded bg-navy-600 px-4 py-2 text-caption font-semibold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Bookmark size={14} strokeWidth={1.5} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            {saveError && (
              <p className="text-caption text-risk-high-fg mt-2">{saveError}</p>
            )}
          </section>
        )}

        {error && (
          <div className="mb-4 rounded border border-risk-high-border bg-risk-high-bg px-4 py-3 text-body text-risk-high-fg">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-lg border border-[var(--cl-border)] bg-surface shadow-1">
          <div className="border-b border-[var(--cl-border-subtle)] px-5 py-4">
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-1">Saved profiles</p>
            <h2 className="text-h2 text-[var(--cl-text)]">Businesses under monitoring</h2>
          </div>

          {loading && (
            <div className="divide-y divide-[var(--cl-border-subtle)]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse bg-surface" />
              ))}
            </div>
          )}

          {!loading && profiles.length > 0 && (
            <div className="divide-y divide-[var(--cl-border-subtle)]">
              {profiles.map((profile) => (
                <div key={profile.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Building2 size={15} strokeWidth={1.5} className="text-navy-600" />
                      <h3 className="text-h3 text-[var(--cl-text)]">{profile.label}</h3>
                    </div>
                    <p className="text-caption text-[var(--cl-text-muted)] mb-2">
                      {profile.profile_json.industry} · {profile.profile_json.location} · Saved {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                    {profile.profile_json.activities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.profile_json.activities.slice(0, 6).map((activity) => (
                          <span key={activity} className="rounded-sm border border-[var(--cl-border)] bg-sunken px-2 py-0.5 font-mono text-citation text-[var(--cl-text-secondary)]">
                            {activity}
                          </span>
                        ))}
                        {profile.profile_json.activities.length > 6 && (
                          <span className="font-mono text-citation text-[var(--cl-text-muted)]">
                            +{profile.profile_json.activities.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    disabled={deletingIds.has(profile.id)}
                    aria-label={`Delete ${profile.label}`}
                    className="shrink-0 rounded p-1.5 text-[var(--cl-text-muted)] transition-colors hover:bg-risk-high-bg hover:text-risk-high-fg disabled:opacity-40"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && profiles.length === 0 && !error && (
            <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
              <Bookmark size={32} strokeWidth={1.5} className="text-[var(--cl-text-muted)]" />
              <p className="text-h2 text-[var(--cl-text)]">No saved profiles yet</p>
              <p className="text-body text-[var(--cl-text-muted)]">
                Run a scan and save it here to track regulatory changes.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
