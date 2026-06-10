'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TexasRegion = {
  id: string
  name: string
  regulations: number
  risk: string
  path: string
  label: { x: number; y: number }
  card: { left: string; top: string }
}

const TEXAS_REGIONS: TexasRegion[] = [
  {
    id: 'west-texas',
    name: 'West Texas',
    regulations: 71,
    risk: 'Water use approvals for food service expansion',
    path: 'M74 34 L158 24 L171 116 L146 188 L105 221 L61 250 L38 197 L51 144 L31 97 Z',
    label: { x: 96, y: 137 },
    card: { left: '9%', top: '26%' },
  },
  {
    id: 'dallas',
    name: 'Dallas',
    regulations: 184,
    risk: 'Certificate of occupancy timing',
    path: 'M158 24 L248 45 L286 83 L231 124 L171 116 Z',
    label: { x: 215, y: 78 },
    card: { left: '47%', top: '9%' },
  },
  {
    id: 'richardson',
    name: 'Richardson',
    regulations: 58,
    risk: 'Zoning compatibility for storefront buildout',
    path: 'M220 57 L250 65 L260 88 L232 102 L207 87 Z',
    label: { x: 235, y: 82 },
    card: { left: '55%', top: '18%' },
  },
  {
    id: 'austin',
    name: 'Austin',
    regulations: 142,
    risk: 'Outdoor service and sign permitting',
    path: 'M146 188 L171 116 L231 124 L246 179 L213 224 L159 229 Z',
    label: { x: 191, y: 174 },
    card: { left: '39%', top: '40%' },
  },
  {
    id: 'houston',
    name: 'Houston',
    regulations: 167,
    risk: 'Health inspection and alcohol posting sequence',
    path: 'M246 179 L304 88 L329 143 L372 170 L350 204 L304 235 L256 224 L213 224 Z',
    label: { x: 298, y: 179 },
    card: { left: '60%', top: '39%' },
  },
  {
    id: 'san-antonio',
    name: 'San Antonio',
    regulations: 119,
    risk: 'Historic district review before lease changes',
    path: 'M105 221 L159 229 L213 224 L229 286 L193 331 L139 304 L93 278 Z',
    label: { x: 166, y: 270 },
    card: { left: '28%', top: '60%' },
  },
  {
    id: 'gulf-coast',
    name: 'Gulf Coast',
    regulations: 96,
    risk: 'Floodplain documentation and signage controls',
    path: 'M229 286 L256 224 L304 235 L350 204 L361 252 L319 274 L308 331 L258 349 Z',
    label: { x: 299, y: 275 },
    card: { left: '58%', top: '64%' },
  },
  {
    id: 'south-texas',
    name: 'South Texas',
    regulations: 83,
    risk: 'State tax registration and local vendor permits',
    path: 'M139 304 L193 331 L258 349 L225 423 L184 400 L157 348 Z',
    label: { x: 193, y: 365 },
    card: { left: '36%', top: '76%' },
  },
]

const TEXAS_OUTLINE =
  'M74 34 L158 24 L248 45 L304 88 L329 143 L372 170 L350 204 L361 252 L319 274 L308 331 L258 349 L225 423 L184 400 L157 348 L117 320 L93 278 L61 250 L38 197 L51 144 L31 97 Z'

interface InteractiveTexasMapProps {
  className?: string
  compact?: boolean
  showPanel?: boolean
}

export function InteractiveTexasMap({ className, compact = false, showPanel = true }: InteractiveTexasMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()
  const activeRegion = TEXAS_REGIONS.find(region => region.id === activeId)

  return (
    <div
      className={cn(
        'relative min-h-[300px] overflow-hidden rounded-[8px] border border-[#d9dde3] bg-[#f8fafb]',
        className,
      )}
      onPointerLeave={event => {
        if (event.pointerType === 'mouse') setActiveId(null)
      }}
    >
      <svg
        viewBox="0 0 410 460"
        role="img"
        aria-labelledby="texas-map-title texas-map-desc"
        className="h-full min-h-[300px] w-full"
      >
        <title id="texas-map-title">Texas regulatory intelligence map</title>
        <desc id="texas-map-desc">
          Interactive Texas regions showing active regulations and top compliance risks for CivicLens customers.
        </desc>
        <path d={TEXAS_OUTLINE} fill="#ffffff" stroke="#1f2937" strokeWidth="1.8" />
        {TEXAS_REGIONS.map(region => {
          const isActive = activeId === region.id

          return (
            <g key={region.id}>
              <path
                d={region.path}
                fill={isActive ? '#4f7d7a' : '#eef2f4'}
                stroke="#cfd6dc"
                strokeWidth="1.4"
                role="button"
                tabIndex={0}
                aria-label={`${region.name}: ${region.regulations} active regulations tracked. Top risk: ${region.risk}.`}
                className="cursor-pointer transition-[fill,filter] duration-200 ease-out focus:outline-none"
                style={{ filter: isActive ? 'drop-shadow(0 10px 16px rgba(31, 41, 55, 0.18))' : undefined }}
                onPointerEnter={() => setActiveId(region.id)}
                onFocus={() => setActiveId(region.id)}
                onBlur={() => setActiveId(null)}
                onClick={() => setActiveId(region.id)}
              />
              <text
                x={region.label.x}
                y={region.label.y}
                textAnchor="middle"
                className="pointer-events-none select-none fill-[#25313f] text-[12px] font-semibold"
              >
                {compact ? region.name.split(' ')[0] : region.name}
              </text>
            </g>
          )
        })}
      </svg>

      {showPanel && activeRegion && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute bottom-4 left-4 right-4 z-20 rounded-[8px] border border-[#d7dde3] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)] sm:bottom-auto sm:right-auto sm:top-[var(--card-top)] sm:w-[260px] sm:left-[var(--card-left)]"
          style={
            {
              '--card-left': activeRegion.card.left,
              '--card-top': activeRegion.card.top,
            } as CSSProperties
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#111827]">{activeRegion.name}</p>
              <p className="mt-1 text-xs text-[#5b6573]">{activeRegion.regulations} active regulations tracked</p>
            </div>
            <span className="rounded-full bg-[#edf5f3] px-2 py-1 text-xs font-semibold text-[#315f5c]">Live</span>
          </div>
          <p className="mt-3 text-sm leading-5 text-[#374151]">{activeRegion.risk}</p>
          <Link
            href="/map"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#315f5c] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f5c]"
          >
            View details
            <ArrowUpRight size={14} strokeWidth={1.8} />
          </Link>
        </motion.div>
      )}
    </div>
  )
}

export { TEXAS_REGIONS }
