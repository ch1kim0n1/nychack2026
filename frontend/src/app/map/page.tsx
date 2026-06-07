import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner'

// MapLibre GL accesses browser globals at module level — must skip SSR.
const TexasMap = dynamic(
  () => import('@/components/map/TexasMap').then(m => ({ default: m.TexasMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full flex items-center justify-center text-sm"
        style={{ background: 'var(--cl-navy-900)', color: 'var(--cl-text-muted)' }}
      >
        Loading map…
      </div>
    ),
  },
)

export default function MapPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Nav variant="app" />
      <DisclaimerBanner />

      <main className="flex-1 px-6 py-6 max-w-app mx-auto w-full flex flex-col">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-h1 text-[var(--cl-text)]">Texas Compliance Map</h1>
          <p className="mt-1 text-body text-[var(--cl-text-secondary)] max-w-prose">
            Click any city to see the licenses required, key restrictions, documents to prepare,
            and agency contacts for opening a business there. Dallas and Austin have different
            stacks of documents — even though they&apos;re in the same state.
          </p>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3">
            <span className="flex items-center gap-1.5 text-caption text-[var(--cl-text-secondary)]">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ background: 'var(--cl-navy-600)' }}
              />
              Verified — ingested from official TX government sources
            </span>
            <span className="flex items-center gap-1.5 text-caption text-[var(--cl-text-muted)]">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ background: 'var(--cl-text-muted)' }}
              />
              Preview — representative data, full coverage coming soon
            </span>
          </div>
        </div>

        {/* Map card — dark, edge-to-edge. Explicit height so MapLibre reads the
            correct offsetHeight at init time (flex-1 alone resolves too late). */}
        <div className="rounded-xl overflow-hidden w-full" style={{ height: 'calc(100vh - 280px)', minHeight: '520px' }}>
          <TexasMap className="h-full w-full" />
        </div>

        {/* Footer note */}
        <p className="mt-4 text-caption text-[var(--cl-text-muted)] text-center">
          Requirements shown are informational guidance, not legal advice.{' '}
          <Link href="/intake" className="text-navy-600 hover:underline">
            Run a scan
          </Link>{' '}
          for a personalized compliance analysis of your specific business.
        </p>
      </main>
    </div>
  )
}
