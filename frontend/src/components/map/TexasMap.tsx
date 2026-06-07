'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { X, ExternalLink, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CITIES, type CityCompliance, type ComplianceItem } from '@/data/texas-compliance'

// ── Real geographic coordinates ─────────────────────────────────────────────
// The SVG uses an approximate linear projection — good enough for a static
// map but visibly wrong when overlaid on real tiles. Use exact coordinates
// keyed by city id so markers align with the basemap at every zoom level.
const CITY_LNGLAT: Record<string, [number, number]> = {
  'austin': [-97.7431, 30.2672],
  'dallas': [-96.7970, 32.7767],
}

// Use MapTiler Streets Dark when a key is supplied; fall back to CARTO Dark
// (no key needed) so the map always works out of the box.
const TILE_STYLE = process.env.NEXT_PUBLIC_MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
  : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// ── Marker element factory ──────────────────────────────────────────────────
// el is what MapLibre uses for anchor:center — its offsetWidth/offsetHeight
// determines the pixel offset applied to position the marker.
//
// Structure:
//   el  (wrapper, same pixel size as the dot visual — so anchor:center lands
//        exactly on the dot center at the lat/lng coordinate)
//     dot  (position:absolute — also a positioned ancestor, so hi anchors to it)
//       hi  (specular highlight, inside dot)
//     tooltip  (position:absolute, floats above el)
//     label    (position:absolute, floats below el)
//
// MapLibre transforms el.style via DOM.setTransform — never mutate el.style
// from event handlers. Scale the inner dot instead.
function buildMarkerEl(
  city: CityCompliance,
  compact: boolean,
  onClick: () => void,
): HTMLElement {
  // All six cities use the same dot size and anchor geometry so MapLibre
  // computes the same anchor offset for every marker.
  const dotSize   = 14
  const dotColor  = '#5B9BD5'
  const dotShadow = 'rgba(91,155,213,0.55)'
  const dotShadowHov = 'rgba(91,155,213,0.85)'

  // el size matches dot visual size so anchor:'center' == dot center == lat/lng.
  // Tooltip + label are absolutely positioned and out of flow — they do NOT
  // contribute to offsetWidth / offsetHeight that MapLibre reads.
  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'relative',
    width:    `${dotSize}px`,
    height:   `${dotSize}px`,
    cursor:   'pointer',
  })

  // ── Visual dot ──
  const dot = document.createElement('div')
  Object.assign(dot.style, {
    position:     'absolute',
    inset:        '0',
    borderRadius: '50%',
    background:   dotColor,
    border:       '2px solid rgba(255,255,255,0.55)',
    boxShadow:    `0 0 10px ${dotShadow}`,
    transition:   'transform 0.15s ease, box-shadow 0.15s ease',
  })

  // Specular highlight
  const hi = document.createElement('div')
  Object.assign(hi.style, {
    position:      'absolute',
    top:           '2px',
    left:          '2px',
    width:         '4px',
    height:        '4px',
    borderRadius:  '50%',
    background:    'rgba(255,255,255,0.65)',
    pointerEvents: 'none',
  })
  dot.appendChild(hi)
  el.appendChild(dot)

  // ── Hover tooltip — above el ──
  const tooltip = document.createElement('div')
  Object.assign(tooltip.style, {
    position:       'absolute',
    bottom:         'calc(100% + 8px)',
    left:           '50%',
    transform:      'translateX(-50%)',
    padding:        '4px 10px',
    background:     'rgba(6,18,32,0.92)',
    border:         '1px solid rgba(91,155,213,0.4)',
    borderRadius:   '6px',
    display:        'flex',
    alignItems:     'center',
    gap:            '6px',
    whiteSpace:     'nowrap',
    fontSize:       '12px',
    fontWeight:     '500',
    color:          '#fff',
    backdropFilter: 'blur(6px)',
    opacity:        '0',
    pointerEvents:  'none',
    transition:     'opacity 0.15s ease',
    zIndex:         '10',
  })
  const tName = document.createElement('span')
  tName.textContent = city.name
  const tHint = document.createElement('span')
  tHint.textContent = 'Click to explore →'
  Object.assign(tHint.style, { color: 'rgba(255,255,255,0.42)', fontWeight: '400' })
  tooltip.appendChild(tName)
  tooltip.appendChild(tHint)
  el.appendChild(tooltip)

  // ── Pill label — below el (full mode only) ──
  if (!compact) {
    const label = document.createElement('div')
    Object.assign(label.style, {
      position:      'absolute',
      top:           'calc(100% + 5px)',
      left:          '50%',
      transform:     'translateX(-50%)',
      padding:       '2px 8px',
      background:    'rgba(6,18,32,0.84)',
      color:         'rgba(255,255,255,0.92)',
      fontSize:      '11px',
      fontWeight:    '600',
      fontFamily:    'system-ui, sans-serif',
      borderRadius:  '999px',
      whiteSpace:    'nowrap',
      pointerEvents: 'none',
      letterSpacing: '0.025em',
    })
    label.textContent = city.name
    el.appendChild(label)
  }

  // Hover scales the inner dot — never mutate el.style.transform (MapLibre owns it)
  el.addEventListener('mouseenter', () => {
    dot.style.transform = 'scale(1.45)'
    dot.style.boxShadow = `0 0 22px ${dotShadowHov}`
    tooltip.style.opacity = '1'
  })
  el.addEventListener('mouseleave', () => {
    dot.style.transform = ''
    dot.style.boxShadow = `0 0 10px ${dotShadow}`
    tooltip.style.opacity = '0'
  })
  el.addEventListener('click', e => { e.stopPropagation(); onClick() })

  return el
}

// ── Component ───────────────────────────────────────────────────────────────

interface TexasMapProps {
  compact?: boolean
  className?: string
}

export function TexasMap({ compact = false, className }: TexasMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<CityCompliance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false
    const markers: maplibregl.Marker[] = []

    const map = new maplibregl.Map({
      container:   containerRef.current,
      style:       TILE_STYLE,
      center:      [-99.5, 31.2],   // geographic centre of Texas
      zoom:        compact ? 4.5 : 5.5,
      minZoom:     3.5,
      maxZoom:     16,
      attributionControl: false,
    })

    // Navigation controls (zoom +/− only, no compass)
    if (!compact) {
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'bottom-right',
      )
    }
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left',
    )

    // Debounced resize: only call map.resize() when the container actually
    // changes size (not during zoom animation, which doesn't resize the element).
    let resizeTimer: ReturnType<typeof setTimeout>
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => map.resize(), 50)
    })
    ro.observe(containerRef.current)

    map.on('load', () => {
      if (destroyed) return
      map.resize()

      // City markers — use real coordinates so they align with basemap labels
      CITIES.forEach(city => {
        const lngLat = CITY_LNGLAT[city.id]
        if (!lngLat) return
        const [lng, lat] = lngLat
        const el = buildMarkerEl(city, compact, () => setSelected(city))
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map)
        markers.push(marker)
      })
    })

    return () => {
      destroyed = true
      clearTimeout(resizeTimer)
      ro.disconnect()
      markers.forEach(m => m.remove())
      map.remove()
    }
  }, [compact])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div ref={containerRef} className="w-full h-full" />
      {selected && (
        <CityPanel city={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

// ─── Item type badge ──────────────────────────────────────────────────────────

function ItemTypeBadge({ type }: { type: ComplianceItem['type'] }) {
  const styles: Record<string, string> = {
    license:      'bg-navy-100 text-navy-600 border-[var(--cl-border)]',
    permit:       'bg-risk-med-bg text-risk-med-fg border-risk-med-border',
    registration: 'bg-risk-low-bg text-risk-low-fg border-risk-low-border',
    tax:          'bg-risk-low-bg text-risk-low-fg border-risk-low-border',
    inspection:   'bg-risk-med-bg text-risk-med-fg border-risk-med-border',
  }
  return (
    <span
      className={cn(
        'inline-block font-mono text-citation px-1.5 py-0.5 rounded-sm border capitalize whitespace-nowrap shrink-0',
        styles[type] ?? 'bg-sunken text-[var(--cl-text-muted)] border-[var(--cl-border)]',
      )}
    >
      {type}
    </span>
  )
}

// ─── City slide-out panel ─────────────────────────────────────────────────────

function CityPanel({ city, onClose }: { city: CityCompliance; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])'),
    )
    focusable[0]?.focus()
    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [city])

  return (
    <>
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Compliance requirements for ${city.name}`}
        className="fixed right-0 top-0 h-full w-full max-w-[520px] bg-surface shadow-3 z-50 flex flex-col overflow-y-auto"
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--cl-border-subtle)] shrink-0 bg-navy-900 text-white">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-h2 text-white">{city.name}</h2>
              {city.dataQuality === 'real' ? (
                <span className="font-mono text-citation px-2 py-0.5 rounded-sm border border-risk-low-border bg-risk-low-bg text-risk-low-fg">
                  Verified data
                </span>
              ) : (
                <span className="font-mono text-citation px-2 py-0.5 rounded-sm border border-navy-800 bg-navy-800 text-white/55">
                  Preview
                </span>
              )}
            </div>
            <p className="text-caption text-white/55">{city.tagline}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="p-1.5 rounded text-white/55 hover:text-white transition-colors shrink-0 ml-3"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-6">
          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Licenses &amp; Permits Required
            </p>
            <div className="space-y-2">
              {city.licenses.map((item, i) => (
                <div key={i} className="rounded border border-[var(--cl-border-subtle)] bg-canvas px-3 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-body font-semibold text-[var(--cl-text)] leading-snug">{item.name}</p>
                    <ItemTypeBadge type={item.type} />
                  </div>
                  <p className="text-caption text-[var(--cl-text-muted)] mb-1">{item.agency}</p>
                  <div className="flex flex-wrap gap-3 font-mono text-citation text-[var(--cl-text-secondary)]">
                    {item.estimatedTime && <span>⏱ {item.estimatedTime}</span>}
                    {item.estimatedCost && <span>$ {item.estimatedCost}</span>}
                  </div>
                  {item.notes && (
                    <p className="mt-1 text-caption text-[var(--cl-text-muted)] italic">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Key Restrictions
            </p>
            <ul className="space-y-2">
              {city.restrictions.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-body text-[var(--cl-text-secondary)]">
                  <ChevronRight size={14} className="shrink-0 text-[var(--cl-text-muted)] mt-0.5" strokeWidth={1.5} />
                  {r}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Documents to Prepare
            </p>
            <ul className="space-y-1.5">
              {city.documents.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-body text-[var(--cl-text-secondary)]">
                  <span className="text-[var(--cl-text-muted)] shrink-0 mt-0.5">·</span>
                  {d}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-label uppercase tracking-[0.06em] text-[var(--cl-text-muted)] mb-3">
              Key Agencies
            </p>
            <div className="space-y-2">
              {city.agencies.map((agency, i) => (
                <div key={i} className="rounded border border-[var(--cl-border-subtle)] bg-canvas px-3 py-3">
                  <p className="text-body font-semibold text-[var(--cl-text)]">{agency.name}</p>
                  <p className="text-caption text-[var(--cl-text-muted)] mt-0.5">{agency.role}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-caption">
                    {agency.phone && (
                      <a href={`tel:${agency.phone}`} className="text-navy-600 hover:underline">
                        {agency.phone}
                      </a>
                    )}
                    {agency.website && (
                      <a
                        href={agency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-navy-600 hover:underline"
                      >
                        Visit site <ExternalLink size={10} strokeWidth={1.5} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-risk-med-border bg-risk-med-bg rounded p-4">
            <p className="text-label uppercase tracking-[0.06em] text-risk-med-fg mb-2">
              Watch Out For
            </p>
            <ul className="space-y-2">
              {city.watchOut.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-caption text-risk-med-fg">
                  <span className="shrink-0 mt-px">⚠</span>
                  {w}
                </li>
              ))}
            </ul>
          </section>

          {city.dataQuality === 'placeholder' && (
            <p className="text-caption text-[var(--cl-text-muted)] bg-sunken border border-[var(--cl-border)] rounded px-3 py-2">
              Preview — requirements shown are representative. CivicLens has ingested verified data for Austin and Dallas. Full coverage for this city is coming soon.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
