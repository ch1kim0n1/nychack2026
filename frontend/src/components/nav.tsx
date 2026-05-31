'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/theme'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavProps {
  variant?: 'marketing' | 'app'
  businessSummary?: string
  onCompare?: () => void
}

export function Nav({ variant = 'marketing', businessSummary, onCompare }: NavProps) {
  const { theme, toggle } = useTheme()
  const isApp = variant === 'app'

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

      {/* Center — business summary chip (app mode) */}
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
            <Link href="/checklist" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
              Checklist
            </Link>
            <Link href="/lease" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden lg:inline">
              Lease check
            </Link>
            <Link href="/report" className="text-caption text-[var(--cl-text-muted)] hover:text-white transition-colors hidden md:inline">
              Report
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
      </div>
    </header>
  )
}
