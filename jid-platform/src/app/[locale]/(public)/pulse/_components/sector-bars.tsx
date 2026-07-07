'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { SectorDemandRow } from '@/lib/pulse/queries'
import { formatArabicNumber } from '@/lib/pulse/format-helpers'

type SectorBarsProps = {
  items: SectorDemandRow[]
}

/** Section 6.9 — sector demand bars (plain div widths, no chart library). */
export function SectorBars({ items }: SectorBarsProps) {
  const prefersReducedMotion = useReducedMotion()
  const max = Math.max(...items.map((row) => row.active_job_count), 1)

  return (
    <div className="space-y-3" aria-label="طلب القطاعات">
      {items.map((row) => {
        const widthPct = Math.round((row.active_job_count / max) * 100)
        const label = row.name_ar?.trim() || row.name_en

        return (
          <div key={row.sector_id} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-jid-ink">{label}</span>
              <span className="tabular-nums text-jid-ink/70">
                {formatArabicNumber(row.active_job_count)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-jid-line/30">
              <motion.div
                className="h-full rounded-full bg-jid-olive"
                initial={prefersReducedMotion ? { width: `${widthPct}%` } : { width: 0 }}
                whileInView={{ width: `${widthPct}%` }}
                viewport={{ once: true, amount: 0.3 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
