'use client'

import { motion } from 'framer-motion'
import type { SkillsDemandRow } from '@/lib/pulse/queries'
import { formatArabicNumber } from '@/lib/pulse/format-helpers'

type SkillsBarsProps = {
  items: SkillsDemandRow[]
}

/** Section 6.10 — skills demand bars (plain div widths, no chart library). */
export function SkillsBars({ items }: SkillsBarsProps) {
  const max = Math.max(...items.map((row) => row.active_job_count), 1)

  return (
    <div className="space-y-3" aria-label="طلب المهارات">
      {items.map((row) => {
        const widthPct = Math.round((row.active_job_count / max) * 100)

        return (
          <div key={row.skill_name} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-jid-ink">{row.skill_name}</span>
              <span className="tabular-nums text-jid-ink/60">
                {formatArabicNumber(row.active_job_count)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-jid-line/30">
              <motion.div
                className="h-full rounded-full bg-jid-gold"
                initial={{ width: 0 }}
                whileInView={{ width: `${widthPct}%` }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
