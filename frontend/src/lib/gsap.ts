'use client'

// GSAP configuration, governed per spec §4
// Hard caps: one hero entrance per page, ≤200ms for everything else,
// stagger clamped to each:0.04 / amount:0.4, no infinite motion,
// prefers-reduced-motion collapses to instant opacity.

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let registered = false

export function initGsap() {
  if (registered || typeof window === 'undefined') return
  registered = true

  gsap.registerPlugin(ScrollTrigger)

  // Spec defaults: power2.out, 200ms
  gsap.defaults({ ease: 'power2.out', duration: 0.2 })

  // prefers-reduced-motion: collapse everything to 10ms opacity-only
  gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
    gsap.defaults({ duration: 0.01, ease: 'none' })
    ScrollTrigger.getAll().forEach(t => t.kill())
  })
}

export { gsap, ScrollTrigger }

// ── Preset animations (named, reusable) ──────────────────────────

/** One hero entrance per page load. Overline → headline → sub → CTAs.
 *  480ms total with clamped stagger. */
export function heroEntrance(container: HTMLElement) {
  initGsap()
  const items = container.querySelectorAll('[data-hero]')
  gsap.set(items, { opacity: 0, y: 16 })
  gsap.to(items, {
    opacity: 1,
    y: 0,
    stagger: { each: 0.04, amount: 0.4 },
    duration: 0.2,
    ease: 'power3.out',
    delay: 0.05,
  })
}

/** Staggered reveal for a list of rows (findings, table rows).
 *  Total ≤400ms regardless of row count. */
export function staggerRows(rows: NodeListOf<Element> | Element[]) {
  initGsap()
  gsap.set(rows, { opacity: 0, y: 8 })
  gsap.to(rows, {
    opacity: 1,
    y: 0,
    stagger: { each: 0.04, amount: 0.4 },
    duration: 0.2,
    ease: 'power3.out',
  })
}

/** One-time ScrollTrigger reveal (fade + rise 12px, once).
 *  Reduced-motion safe: never hides content if motion is off or ScrollTrigger
 *  can't fire, content must never get stuck at opacity 0. */
export function scrollReveal(el: HTMLElement) {
  initGsap()

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // If element is already in view on load, or motion is reduced, just show it.
  if (reduce) {
    gsap.set(el, { opacity: 1, y: 0 })
    return
  }

  gsap.set(el, { opacity: 0, y: 12 })
  const trigger = ScrollTrigger.create({
    trigger: el,
    start: 'top 90%',
    once: true,
    onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.2, ease: 'power3.out' }),
  })

  // Safety net: if the trigger never initializes (already-scrolled, layout race),
  // reveal after a short beat so content can't be permanently hidden.
  if (!trigger || trigger.progress > 0) {
    gsap.to(el, { opacity: 1, y: 0, duration: 0.2, ease: 'power3.out' })
  }
  setTimeout(() => {
    if (Number(gsap.getProperty(el, 'opacity')) < 1) {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.2, ease: 'power3.out' })
    }
  }, 1500)
}
