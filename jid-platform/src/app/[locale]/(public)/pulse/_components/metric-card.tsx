'use client'

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics/track'
import {
  formatArabicNumber,
  formatArabicPercentage,
} from '@/lib/pulse/format-helpers'
import type { MetricFormat } from '@/lib/pulse/metrics-config'

type MetricCardProps = {
  labelAr: string
  value: number
  format: MetricFormat
  /** `metric_thresholds.metric_key` — used for analytics. */
  metricKey: string
}

/** Section 6.7 — count-up card; animates once when scrolled into view. */
export function MetricCard({ labelAr, value, format, metricKey }: MetricCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isInView = useInView(ref, { once: true, amount: 0.35 })
  const motionValue = useMotionValue(0)
  const animatedRef = useRef(false)

  const displayValue = useTransform(motionValue, (current) =>
    format === 'percentage'
      ? formatArabicPercentage(current)
      : formatArabicNumber(current),
  )

  useEffect(() => {
    if (!isInView || animatedRef.current) return
    animatedRef.current = true
    track('pulse_metric_animated_into_view', { metric_key: metricKey, value })

    if (prefersReducedMotion) {
      motionValue.set(value)
      return
    }

    const controls = animate(motionValue, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
    })
    return () => controls.stop()
  }, [isInView, metricKey, motionValue, prefersReducedMotion, value])

  return (
    <article
      ref={ref}
      className="rounded-lg border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm"
    >
      <p className="text-xs font-medium text-muted-foreground">{labelAr}</p>
      <motion.p
        className="mt-2 text-2xl font-semibold tabular-nums text-primary"
        aria-live="off"
      >
        {displayValue}
      </motion.p>
    </article>
  )
}
