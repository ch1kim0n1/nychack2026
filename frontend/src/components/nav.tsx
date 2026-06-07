'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavProps {
  variant?: 'marketing' | 'app'
  businessSummary?: string
  onCompare?: () => void
  loadingData?: boolean
}

// Routes whose pages depend on the loaded analysis result and bounce to
// /intake when it isn't ready yet, disabled while the dashboard is loading.
const DATA_DEPENDENT_ROUTES = new Set(['/checklist', '/lease', '/readiness', '/report'])

export function Nav({ variant = 'marketing', businessSummary, onCompare, loadingData = false }: NavProps) {
  const { theme, toggle } = useTheme()
  const isApp = variant === 'app'
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile menu on route change / selection
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // App routes exposed in the mobile drawer (mirrors the desktop links)
  const appRoutes: { label: string; href: string }[] = [
    { label: 'Compare', href: '/diff' },
    { label: 'Scenarios', href: '/scenarios' },
    { label: 'Radar', href: '/radar' },
    { label: 'Checklist', href: '/checklist' },
    { label: 'Lease check', href: '/lease' },
    { label: 'Readiness', href: '/readiness' },
    { label: 'Report', href: '/report' },
    { label: 'Watchlist', href: '/watchlist' },
  ]

  return (
    <header
      className={cn(
        'flex items-center justify-between px-8 no-print',
        isApp ? 'h-14 bg-navy-900 text-white' : 'h-16 bg-navy-900 text-white',
      )}
    >
      {/* Wordmark */}
      <Link href="/home" className="font-semibold text-body-lg tracking-tight text-white hover:opacity-80 transition-opacity">
        CivicLens
      </Link>

      {/* Center, business summary chip (app mode) */}
      {isApp && businessSummary && (
        <span className="font-mono text-caption text-[var(--cl-text-muted)] bg-navy-800 border border-[var(--cl-border)] rounded-sm px-3 py-1 hidden md:inline">
          {businessSummary}
        </span>
      )}

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {!isApp && (
          <>
            <Link href="#how-it-works" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
              How it works
            </Link>
            <Link href="#sources" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
              Sources
            </Link>
            <Link href="/pricing" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
              Pricing
            </Link>
          </>
        )}
        {isApp && (
          <>
            {onCompare && (
              <button onClick={onCompare} className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
                Compare ⊞
              </button>
            )}
            <Link href="/scenarios" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
              Scenarios
            </Link>
            <Link href="/radar" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
              Radar
            </Link>
            {loadingData ? (
              <>
                <span className="text-caption text-[var(--cl-text-muted)] opacity-40 hidden md:inline">Checklist</span>
                <span className="text-caption text-[var(--cl-text-muted)] opacity-40 hidden lg:inline">Lease check</span>
                <span className="text-caption text-[var(--cl-text-muted)] opacity-40 hidden lg:inline">Readiness</span>
                <span className="text-caption text-[var(--cl-text-muted)] opacity-40 hidden md:inline">Report</span>
              </>
            ) : (
              <>
                <Link href="/checklist" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
                  Checklist
                </Link>
                <Link href="/lease" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden lg:inline">
                  Lease check
                </Link>
                <Link href="/readiness" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden lg:inline">
                  Readiness
                </Link>
                <Link href="/report" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
                  Report
                </Link>
              </>
            )}
            <Link href="/watchlist" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
              Watchlist
            </Link>
          </>
        )}
        <Link
          href="/intake"
          className={cn(
            'text-caption font-semibold px-3 py-1.5 rounded transition-colors duration-[80ms]',
            isApp
              ? 'text-[var(--cl-text-muted)] hover:text-white'
              : 'bg-navy-600 text-white hover:bg-navy-700',
          )}
        >
          {isApp ? 'New scan' : 'Try it'}
        </Link>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="p-1.5 rounded text-[var(--cl-text-muted)] hover:text-white transition-colors duration-[80ms]"
        >
          {theme === 'light' ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
        </button>

        {/* Mobile hamburger, app routes only, shown below md where links are hidden */}
        {isApp && (
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-app-nav"
            className="p-1.5 rounded text-[var(--cl-text-muted)] hover:text-white transition-colors duration-[80ms] md:hidden"
          >
            {menuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        )}
      </div>

      {/* Mobile drawer, exposes all major app routes below the md breakpoint */}
      {isApp && menuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          {/* Panel */}
          <nav
            id="mobile-app-nav"
            aria-label="App navigation"
            className="absolute right-0 top-0 h-full w-64 bg-navy-900 text-white border-l border-[var(--cl-border)] flex flex-col p-4 gap-1"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-body-lg tracking-tight">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded text-[var(--cl-text-muted)] hover:text-white transition-colors duration-[80ms]"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            {appRoutes.map(route => {
              // Use the provided Compare handler when available; otherwise link to the diff route
              if (route.label === 'Compare' && onCompare) {
                return (
                  <button
                    key={route.label}
                    onClick={() => {
                      setMenuOpen(false)
                      onCompare()
                    }}
                    className="text-left text-caption py-2.5 px-2 rounded transition-colors text-[var(--cl-text-muted)] hover:text-white hover:bg-navy-800"
                  >
                    Compare ⊞
                  </button>
                )
              }
              // Routes that read the analysis result redirect to /intake if it's
              // not ready, disable them while dashboard data is loading (#30).
              if (loadingData && DATA_DEPENDENT_ROUTES.has(route.href)) {
                return (
                  <span
                    key={route.label}
                    className="text-caption py-2.5 px-2 rounded text-[var(--cl-text-muted)] opacity-40"
                  >
                    {route.label}
                  </span>
                )
              }
              return (
                <Link
                  key={route.label}
                  href={route.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-caption py-2.5 px-2 rounded transition-colors text-[var(--cl-text-muted)] hover:text-white hover:bg-navy-800"
                >
                  {route.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
