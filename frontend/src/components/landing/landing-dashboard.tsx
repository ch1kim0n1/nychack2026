'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, FileText, Scale, ShieldAlert } from 'lucide-react'
import { InteractiveTexasMap } from '@/components/landing/interactive-texas-map'

const REGULATORY_ITEMS = [
  {
    source: 'Austin Code',
    title: 'Outdoor dining operating conditions',
    level: 'High',
  },
  {
    source: 'TABC',
    title: 'Mixed beverage permit dependency',
    level: 'High',
  },
  {
    source: 'Dallas Development Services',
    title: 'Certificate of occupancy validation',
    level: 'Medium',
  },
  {
    source: 'Texas Comptroller',
    title: 'Sales tax account registration',
    level: 'Low',
  },
]

const riskStyles: Record<string, string> = {
  High: 'border-[#e6b9b2] bg-[#fff0ed] text-[#9f3d34]',
  Medium: 'border-[#e7d1a5] bg-[#fff7e6] text-[#83581f]',
  Low: 'border-[#b8d7c6] bg-[#edf8f1] text-[#36684f]',
}

export function LandingDashboard() {
  const reducedMotion = useReducedMotion()

  return (
    <motion.section
      id="product"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 lg:py-24"
    >
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold text-[#4f7d7a]">Product intelligence view</p>
        <h2 className="mt-3 text-3xl font-bold leading-[1.05] text-[#101820] sm:text-5xl">
          Texas compliance signals, organized by business impact.
        </h2>
      </div>

      <div className="relative rounded-[8px] border border-[#d9dde3] bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:p-4">
        <div className="grid min-h-[560px] gap-4 lg:grid-cols-[0.86fr_1.2fr_0.94fr]">
          <aside className="rounded-[8px] border border-[#e4e7eb] bg-[#fbfcfd] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#111827]">Regulatory queue</p>
                <p className="mt-1 text-xs text-[#6b7280]">Matched to a Texas restaurant expansion</p>
              </div>
              <FileText size={19} className="text-[#4f7d7a]" aria-hidden="true" />
            </div>
            <div className="mt-5 space-y-3">
              {REGULATORY_ITEMS.map(item => (
                <article key={item.title} className="rounded-[8px] border border-[#e4e7eb] bg-white p-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#6b7280]">{item.source}</p>
                      <h3 className="mt-1 text-sm font-semibold leading-5 text-[#17202b]">{item.title}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${riskStyles[item.level]}`}>
                      {item.level}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </aside>

          <div className="relative rounded-[8px] border border-[#e4e7eb] bg-[#f6f8fa] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#111827]">Texas coverage map</p>
                <p className="mt-1 text-xs text-[#6b7280]">Regional regulatory pressure</p>
              </div>
              <span className="rounded-full border border-[#d5dbdf] bg-white px-3 py-1 text-xs font-semibold text-[#4b5563]">
                920 tracked items
              </span>
            </div>
            <InteractiveTexasMap compact className="h-[480px]" />
          </div>

          <aside className="relative rounded-[8px] border border-[#e4e7eb] bg-[#fbfcfd] p-4">
            <div className="absolute -left-4 top-10 hidden w-[calc(100%+16px)] rounded-[8px] border border-[#d9dde3] bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.16)] lg:block">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Regulation breakdown</p>
                  <p className="mt-1 text-xs text-[#6b7280]">Austin outdoor dining</p>
                </div>
                <ShieldAlert size={19} className="text-[#9f3d34]" aria-hidden="true" />
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#6b7280]">Primary risk</p>
                  <p className="mt-1 text-sm leading-5 text-[#25313f]">Patio service can trigger occupancy, noise, signage, and alcohol service constraints before opening day.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[8px] border border-[#e4e7eb] bg-[#f8fafb] p-3">
                    <p className="text-xs text-[#6b7280]">Confidence</p>
                    <p className="mt-1 text-lg font-bold text-[#101820]">92%</p>
                  </div>
                  <div className="rounded-[8px] border border-[#e4e7eb] bg-[#f8fafb] p-3">
                    <p className="text-xs text-[#6b7280]">Citations</p>
                    <p className="mt-1 text-lg font-bold text-[#101820]">7</p>
                  </div>
                </div>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 rounded-[8px] bg-[#315f5c] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(49,95,92,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(49,95,92,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315f5c]"
                >
                  Review finding
                  <ArrowRight size={15} strokeWidth={1.8} />
                </Link>
              </div>
            </div>

            <div className="lg:hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Regulation breakdown</p>
                  <p className="mt-1 text-xs text-[#6b7280]">Austin outdoor dining</p>
                </div>
                <Scale size={19} className="text-[#4f7d7a]" aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm leading-5 text-[#25313f]">
                Patio service can trigger occupancy, noise, signage, and alcohol service constraints before opening day.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </motion.section>
  )
}
