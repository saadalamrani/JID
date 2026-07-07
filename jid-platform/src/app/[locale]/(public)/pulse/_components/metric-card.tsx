'use client'

import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import {
  formatArabicNumber,
  formatArabicPercentage,
} from '@/lib/pulse/format-helpers'
import type { MetricFormat } from '@/lib/pulse/metrics-config'

type MetricCardProps = {
  labelAr: string
  value: number
  format: MetricFormat
}

/** Section 6.7 — count-up card; animates once when scrolled into view. */
export function MetricCard({ labelAr, value, format }: MetricCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.35 })
  const motionValue = useMotionValue(0)

  const displayValue = useTransform(motionValue, (current) =>
    format === 'percentage'
      ? formatArabicPercentage(current)
      : formatArabicNumber(current),
  )

  useEffect(() => {
    if (!isInView) return
    const controls = animate(motionValue, value, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
    })
    return () => controls.stop()
  }, [isInView, motionValue, value])

  return (
    <article
      ref={ref}
      className="rounded-lg border border-jid-line/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
    >
      <p className="text-xs font-medium text-jid-ink/60">{labelAr}</p>
      <motion.p
        className="mt-2 text-2xl font-semibold tabular-nums text-jid-olive"
        aria-live="off"
      >
        {displayValue}
      </motion.p>
    </article>
  )
}
