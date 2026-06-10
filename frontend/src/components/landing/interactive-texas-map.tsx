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

// Region tiles cover the full state and share edges; they are clipped to the
// accurate TEXAS_OUTLINE below, so only the outer border needs to be exact.
const TEXAS_REGIONS: TexasRegion[] = [
  {
    id: 'west-texas',
    name: 'West Texas',
    regulations: 71,
    risk: 'Water use approvals for food service expansion',
    path: 'M0 0 L252 0 L240 130 L212 260 L196 330 L60 470 L0 470 Z',
    label: { x: 120, y: 145 },
    card: { left: '8%', top: '30%' },
  },
  {
    id: 'dallas',
    name: 'Dallas',
    regulations: 184,
    risk: 'Certificate of occupancy timing',
    path: 'M252 0 L420 0 L420 140 L320 178 L262 178 L240 130 Z',
    label: { x: 290, y: 168 },
    card: { left: '44%', top: '6%' },
  },
  {
    id: 'austin',
    name: 'Austin',
    regulations: 142,
    risk: 'Outdoor service and sign permitting',
    path: 'M240 130 L262 178 L320 178 L310 255 L212 260 Z',
    label: { x: 262, y: 224 },
    card: { left: '6%', top: '52%' },
  },
  {
    id: 'houston',
    name: 'Houston',
    regulations: 167,
    risk: 'Health inspection and alcohol posting sequence',
    path: 'M320 178 L420 140 L420 300 L352 300 L310 255 Z',
    label: { x: 357, y: 230 },
    card: { left: '44%', top: '40%' },
  },
  {
    id: 'san-antonio',
    name: 'San Antonio',
    regulations: 119,
    risk: 'Historic district review before lease changes',
    path: 'M212 260 L310 255 L240 340 L196 330 Z',
    label: { x: 247, y: 300 },
    card: { left: '8%', top: '66%' },
  },
  {
    id: 'gulf-coast',
    name: 'Gulf Coast',
    regulations: 96,
    risk: 'Floodplain documentation and signage controls',
    path: 'M240 340 L310 255 L352 300 L420 300 L420 420 L288 420 L260 380 Z',
    label: { x: 320, y: 295 },
    card: { left: '44%', top: '62%' },
  },
  {
    id: 'south-texas',
    name: 'South Texas',
    regulations: 83,
    risk: 'State tax registration and local vendor permits',
    path: 'M196 330 L240 340 L260 380 L288 420 L300 470 L120 470 Z',
    label: { x: 250, y: 372 },
    card: { left: '36%', top: '78%' },
  },
  // Richardson is a small DFW-metro tile rendered after (on top of) the Dallas
  // region so it stays hoverable.
  {
    id: 'richardson',
    name: 'Richardson',
    regulations: 58,
    risk: 'Zoning compatibility for storefront buildout',
    path: 'M296 128 L322 134 L318 154 L296 150 Z',
    label: { x: 309, y: 122 },
    card: { left: '44%', top: '20%' },
  },
]

// Accurate Texas border traced from real lat/lng border points
// (equirectangular projection: x = 12 + (lng + 106.65) * 29, y = 12 + (36.5 - lat) * 38).
// NM line → panhandle → Red River meanders → NE corner → Sabine → Gulf coast →
// Rio Grande Valley tip → Laredo → Big Bend dip → upstream to El Paso.
const TEXAS_OUTLINE =
  'M13 183 L116 183 L116 12 L205 12 L205 86 ' + // NM line, panhandle
  'L217 91 L227 99 L235 99 L245 101 L258 103 L260 107 L264 111 L273 107 L281 114 L288 113 L295 109 L304 113 L312 117 L325 113 L334 112 L343 109 L353 114 L362 120 L366 121 L378 124 ' + // Red River
  'L378 183 L379 189 L383 200 L387 208 L388 216 L387 223 L388 233 L387 240 L387 251 L385 259 L381 267 L383 271 ' + // east border + Sabine
  'L367 276 L357 283 L347 290 L341 300 L331 306 L319 311 L310 320 L298 323 L291 331 L284 340 L281 341 L280 360 L276 374 L280 390 L281 404 L288 413 ' + // Gulf coast
  'L281 414 L273 410 L261 409 L254 407 L243 401 L233 395 L231 383 L221 372 L221 364 L219 352 L213 347 L205 333 L196 324 L194 313 L186 299 L177 284 L164 268 L147 267 L138 264 L131 269 L127 270 L123 283 L115 295 L110 297 L95 287 L87 284 L76 274 L69 259 L64 244 L60 233 L52 229 L42 218 L31 206 L22 203 L16 191 Z' // Rio Grande to El Paso

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
        viewBox="0 0 410 440"
        role="img"
        aria-labelledby="texas-map-title texas-map-desc"
        className="h-full min-h-[300px] w-full"
      >
        <title id="texas-map-title">Texas regulatory intelligence map</title>
        <desc id="texas-map-desc">
          Interactive Texas regions showing active regulations and top compliance risks for CivicLens customers.
        </desc>
        <defs>
          <clipPath id="texas-state-clip">
            <path d={TEXAS_OUTLINE} />
          </clipPath>
        </defs>
        <path d={TEXAS_OUTLINE} fill="#ffffff" />
        <g clipPath="url(#texas-state-clip)">
          {TEXAS_REGIONS.map(region => {
            const isActive = activeId === region.id

            return (
              <path
                key={region.id}
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
            )
          })}
        </g>
        <path d={TEXAS_OUTLINE} fill="none" stroke="#1f2937" strokeWidth="1.8" strokeLinejoin="round" />
        {TEXAS_REGIONS.map(region => (
          <text
            key={`${region.id}-label`}
            x={region.label.x}
            y={region.label.y}
            textAnchor="middle"
            stroke="#ffffff"
            strokeWidth="3"
            style={{ paintOrder: 'stroke' }}
            className={cn(
              'pointer-events-none select-none fill-[#25313f] font-semibold',
              region.id === 'richardson' || compact ? 'text-[10px]' : 'text-[12px]',
            )}
          >
            {region.name}
          </text>
        ))}
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
