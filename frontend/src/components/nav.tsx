'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme'

interface NavProps {
  variant?: 'marketing' | 'app'
  onCompare?: () => void
  loadingData?: boolean
}

const DATA_DEPENDENT_ROUTES = new Set(['/checklist', '/lease', '/readiness', '/report'])

export function Nav({ variant = 'marketing', onCompare, loadingData = false }: NavProps) {
  const { theme, toggle } = useTheme()
  const isApp = variant === 'app'
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const appRoutes: { label: string; href: string }[] = [
    { label: 'Compare', href: '/diff' },
    { label: 'Scenarios', href: '/scenarios' },
    { label: 'Radar', href: '/radar' },
    { label: 'Map', href: '/map' },
    { label: 'Checklist', href: '/checklist' },
    { label: 'Lease check', href: '/lease' },
    { label: 'Readiness', href: '/readiness' },
    { label: 'Report', href: '/report' },
    { label: 'Watchlist', href: '/watchlist' },
  ]

  return (
    <header
      className={cn(
        'no-print flex items-center justify-between border-b border-white/10 bg-navy-900 px-5 text-white shadow-[0_1px_0_rgba(255,255,255,0.04)] md:px-8',
        isApp ? 'h-16' : 'h-[4.5rem]',
      )}
    >
      <Link href="/home" className="flex items-center gap-3 text-white transition-opacity hover:opacity-85">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold tracking-[0.16em]">
          CL
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-body-lg font-semibold tracking-tight">CivicLens</span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">
            {isApp ? 'Command deck' : 'Texas civic ops'}
          </span>
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {!isApp && (
          <>
            <Link href="#how-it-works" className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
              How it works
            </Link>
            <Link href="#sources" className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
              Sources
            </Link>
            <Link href="/pricing" className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
              Pricing
            </Link>
          </>
        )}

        {isApp && (
          <>
            {onCompare && (
              <button onClick={onCompare} className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
                Compare +
              </button>
            )}
            <Link href="/scenarios" className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
              Scenarios
            </Link>
            <Link href="/radar" className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
              Radar
            </Link>
            <Link href="/map" className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
              Map
            </Link>
            {loadingData ? (
              <>
                <span className="hidden text-caption text-white/35 md:inline">Checklist</span>
                <span className="hidden text-caption text-white/35 lg:inline">Lease check</span>
                <span className="hidden text-caption text-white/35 lg:inline">Readiness</span>
                <span className="hidden text-caption text-white/35 md:inline">Report</span>
              </>
            ) : (
              <>
                <Link href="/checklist" className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
                  Checklist
                </Link>
                <Link href="/lease" className="hidden text-caption text-white/65 transition-colors hover:text-white lg:inline">
                  Lease check
                </Link>
                <Link href="/readiness" className="hidden text-caption text-white/65 transition-colors hover:text-white lg:inline">
                  Readiness
                </Link>
                <Link href="/report" className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
                  Report
                </Link>
              </>
            )}
            <Link href="/watchlist" className="hidden text-caption text-white/65 transition-colors hover:text-white md:inline">
              Watchlist
            </Link>
          </>
        )}

        <Link
          href="/intake"
          className={cn(
            'rounded-full border px-4 py-2 text-caption font-semibold transition-colors duration-[80ms]',
            isApp
              ? 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
              : 'border-transparent bg-white text-navy-900 hover:bg-navy-50',
          )}
        >
          {isApp ? 'New scan' : 'Try it'}
        </Link>

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="rounded-full border border-white/10 p-2 text-white/65 transition-colors duration-[80ms] hover:text-white"
        >
          {theme === 'light' ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
        </button>

        {isApp && (
          <button
            onClick={() => setMenuOpen(open => !open)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-app-nav"
            className="rounded-full border border-white/10 p-2 text-white/65 transition-colors duration-[80ms] hover:text-white md:hidden"
          >
            {menuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        )}
      </div>

      {isApp && menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/55"
          />
          <nav
            id="mobile-app-nav"
            aria-label="App navigation"
            className="absolute right-0 top-0 flex h-full w-72 flex-col gap-1 border-l border-white/10 bg-navy-900 p-4 text-white"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-body-lg font-semibold tracking-tight">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-full border border-white/10 p-2 text-white/65 transition-colors duration-[80ms] hover:text-white"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            {appRoutes.map(route => {
              if (route.label === 'Compare' && onCompare) {
                return (
                  <button
                    key={route.label}
                    onClick={() => {
                      setMenuOpen(false)
                      onCompare()
                    }}
                    className="rounded px-3 py-2.5 text-left text-caption text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Compare +
                  </button>
                )
              }

              if (loadingData && DATA_DEPENDENT_ROUTES.has(route.href)) {
                return (
                  <span key={route.label} className="rounded px-3 py-2.5 text-caption text-white/35">
                    {route.label}
                  </span>
                )
              }

              return (
                <Link
                  key={route.label}
                  href={route.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded px-3 py-2.5 text-caption text-white/75 transition-colors hover:bg-white/5 hover:text-white"
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
