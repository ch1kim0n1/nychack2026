'use client'

import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface CitationChipProps {
  url: string
  agency?: string
  onClick?: () => void
  className?: string
}

function agencyFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('tabc')) return 'TABC'
    if (host.includes('austintexas')) return 'City of Austin'
    if (host.includes('dallascityhall')) return 'City of Dallas'
    if (host.includes('comptroller')) return 'TX Comptroller'
    if (host.includes('sos.texas')) return 'TX Sec. of State'
    if (host.includes('legis.state.tx')) return 'TX Legislature'
    if (host.includes('texas.gov')) return 'Texas.gov'
    return host
  } catch {
    return url
  }
}

export function CitationChip({ url, agency, onClick, className }: CitationChipProps) {
  const label = agency ?? agencyFromUrl(url)

  return (
    <button
      type="button"
      title={url}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm min-w-0',
        'font-mono text-citation text-navy-600',
        'border border-[var(--cl-border)] bg-navy-50',
        'hover:underline hover:border-[var(--cl-border-strong)]',
        'transition-colors duration-[80ms] cursor-pointer',
        className,
      )}
    >
      <span className="truncate">{label}</span>
      <ExternalLink size={11} strokeWidth={1.5} className="opacity-60 shrink-0" />
    </button>
  )
}
