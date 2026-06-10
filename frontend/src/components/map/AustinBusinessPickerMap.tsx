'use client'

import type { AustinDemoBusiness } from '@/data/austin-demo-businesses'
import { cn } from '@/lib/utils'
import { MapPin } from 'lucide-react'

interface AustinBusinessPickerMapProps {
  businesses: AustinDemoBusiness[]
  selectedBusinessId: string | null
  onSelectBusiness: (businessId: string) => void
}

const AUSTIN_BOUNDS = {
  west: -97.79,
  east: -97.70,
  north: 30.29,
  south: 30.21,
}

function projectAustinPoint([lng, lat]: [number, number]) {
  const x = ((lng - AUSTIN_BOUNDS.west) / (AUSTIN_BOUNDS.east - AUSTIN_BOUNDS.west)) * 100
  const y = ((AUSTIN_BOUNDS.north - lat) / (AUSTIN_BOUNDS.north - AUSTIN_BOUNDS.south)) * 100

  return {
    left: `${Math.min(92, Math.max(8, x))}%`,
    top: `${Math.min(88, Math.max(10, y))}%`,
  }
}

export function AustinBusinessPickerMap({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
}: AustinBusinessPickerMapProps) {
  return (
    <div className="relative h-[360px] w-full overflow-hidden bg-[#dfe8e3]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'linear-gradient(120deg, transparent 18%, rgba(255,255,255,0.58) 18.5%, transparent 19.5%), linear-gradient(28deg, transparent 34%, rgba(255,255,255,0.7) 35%, transparent 36%), linear-gradient(90deg, rgba(22,34,53,0.08) 1px, transparent 1px), linear-gradient(rgba(22,34,53,0.08) 1px, transparent 1px)',
          backgroundSize: '180px 180px, 220px 220px, 44px 44px, 44px 44px',
          backgroundPosition: '12px 28px, -40px 40px, 0 0, 0 0',
        }}
      />

      <div className="absolute left-4 top-4 rounded border border-white/70 bg-white/86 px-3 py-2 shadow-1">
        <p className="text-label text-[var(--cl-text-muted)]">Austin, TX</p>
        <p className="mt-1 text-caption text-[var(--cl-text-secondary)]">Demo business locations</p>
      </div>

      <div className="absolute bottom-5 left-8 right-8 h-16 rounded-full border-t-2 border-white/80 opacity-75" />
      <div className="absolute left-[18%] top-0 h-full w-16 rotate-[18deg] border-x-2 border-white/70 opacity-75" />
      <div className="absolute left-[55%] top-0 h-full w-14 -rotate-[15deg] border-x-2 border-white/70 opacity-75" />

      {businesses.map(business => {
        const isSelected = business.id === selectedBusinessId
        const position = projectAustinPoint(business.coordinates)

        return (
          <button
            key={business.id}
            type="button"
            aria-label={`Select ${business.name}`}
            aria-pressed={isSelected}
            onClick={() => onSelectBusiness(business.id)}
            className={cn(
              'absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-2.5 py-1.5 text-left shadow-2 transition-[background-color,border-color,box-shadow,transform] duration-[140ms]',
              isSelected
                ? 'border-navy-700 bg-navy-700 text-white'
                : 'border-white/80 bg-white/92 text-[var(--cl-text)] hover:border-navy-600 hover:bg-navy-50',
            )}
            style={position}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                isSelected ? 'bg-white/15 text-white' : 'bg-navy-50 text-navy-700',
              )}
            >
              <MapPin size={15} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="hidden max-w-[128px] truncate text-caption font-semibold sm:inline">
              {business.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
