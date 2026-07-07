'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoryPill } from '@/app/[locale]/(public)/pulse/_components/category-pill'
import { track } from '@/lib/analytics/track'
import { Link } from '@/lib/i18n/navigation'
import type { PulseAnnouncement } from '@/lib/pulse/queries'
import { cn } from '@/lib/utils'

/** Section 6.4 — auto-advance interval (ms). */
export const AUTO_FLIP_INTERVAL = 5000

/**
 * Section 6.4 / Section 10 — hero overlay opacity for text-on-image contrast (≥ 4.5:1).
 * Applied over `hero_image_url` when present; solid fallback uses jid-olive underneath.
 */
export const HERO_IMAGE_OVERLAY_OPACITY = 0.72

type AnnouncementCarouselProps = {
  announcements: PulseAnnouncement[]
}

export function AnnouncementCarousel({ announcements }: AnnouncementCarouselProps) {
  const prefersReducedMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const announcedIndexRef = useRef<number | null>(null)

  const count = announcements.length
  const current = announcements[activeIndex]
  const canAutoFlip = count > 1

  const motionProps = useMemo(
    () =>
      prefersReducedMotion
        ? { initial: {}, animate: {}, exit: {} }
        : {
            initial: { opacity: 0, x: 24 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -24 },
          },
    [prefersReducedMotion],
  )

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }

  useEffect(() => {
    if (!canAutoFlip) return
    if (isPaused || isFocused || isHovered || prefersReducedMotion) return

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count)
    }, AUTO_FLIP_INTERVAL)

    return () => window.clearInterval(timer)
  }, [canAutoFlip, count, isPaused, isFocused, isHovered, prefersReducedMotion])

  useEffect(() => {
    if (activeIndex >= count) {
      setActiveIndex(0)
    }
  }, [activeIndex, count])

  useEffect(() => {
    const slide = announcements[activeIndex]
    if (!slide) return
    if (announcedIndexRef.current === activeIndex) return
    announcedIndexRef.current = activeIndex
    track('pulse_announcement_viewed', {
      announcement_id: slide.id,
      slide_index: activeIndex,
      slide_count: count,
      category: slide.category,
    })
  }, [activeIndex, announcements, count])

  useEffect(() => {
    if (!isHovered) return
    track('pulse_carousel_paused', { reason: 'hover' })
  }, [isHovered])

  useEffect(() => {
    if (!isFocused) return
    track('pulse_carousel_paused', { reason: 'focus' })
  }, [isFocused])

  if (!current) return <AnnouncementEmptyState />

  const liveAnnouncement = `إعلان ${activeIndex + 1} من ${count}: ${current.title_ar}`
  const pauseLabel = isPaused ? 'استئناف التقليب التلقائي' : 'إيقاف التقليب التلقائي'

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="إعلانات المنصة"
      className="relative min-h-[280px] overflow-hidden rounded-xl border border-jid-line bg-jid-olive shadow-sm"
      data-auto-flip={
        canAutoFlip && !isPaused && !isFocused && !isHovered && !prefersReducedMotion
          ? 'true'
          : 'false'
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsFocused(false)
        }
      }}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </p>

      <div className="relative min-h-[280px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={current.id}
            className="absolute inset-0 flex flex-col justify-end"
            role="group"
            aria-roledescription="slide"
            aria-label={`${activeIndex + 1} من ${count}`}
            {...motionProps}
            transition={transition}
          >
            <AnnouncementSlide announcement={current} showControlsPadding={canAutoFlip} />
          </motion.article>
        </AnimatePresence>
      </div>

      {canAutoFlip ? (
        <div className="absolute bottom-0 start-0 end-0 flex items-center justify-between gap-3 border-t border-white/10 bg-jid-ink/40 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2" role="group" aria-label="مؤشرات الإعلانات">
            {announcements.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'h-2.5 w-2.5 rounded-full border border-white/50 transition-colors',
                  index === activeIndex ? 'bg-white' : 'bg-white/25 hover:bg-white/50',
                )}
                aria-label={`الانتقال إلى الإعلان ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
            aria-pressed={isPaused}
            aria-label={pauseLabel}
            onClick={() => {
              setIsPaused((value) => {
                const next = !value
                if (next) {
                  track('pulse_carousel_paused', { reason: 'manual' })
                }
                return next
              })
            }}
          >
            {isPaused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
            <span aria-hidden>{isPaused ? 'تشغيل' : 'إيقاف'}</span>
          </button>
        </div>
      ) : null}
    </section>
  )
}

type AnnouncementSlideProps = {
  announcement: PulseAnnouncement
  showControlsPadding: boolean
}

function AnnouncementSlide({ announcement, showControlsPadding }: AnnouncementSlideProps) {
  return (
    <div
      className={cn(
        'relative flex h-full min-h-[280px] flex-col justify-end p-6',
        showControlsPadding ? 'pb-16' : 'pb-6',
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-jid-olive"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-jid-ink"
        style={{ opacity: HERO_IMAGE_OVERLAY_OPACITY }}
        aria-hidden
      />

      <div className="relative z-10 max-w-2xl space-y-3 text-white">
        <CategoryPill category={announcement.category} />
        <h2 className="text-2xl font-semibold leading-snug text-white">{announcement.title_ar}</h2>
        {announcement.body_ar ? (
          <p className="text-sm leading-relaxed text-white">{announcement.body_ar}</p>
        ) : null}
        {announcement.cta_url ? (
          <a
            href={announcement.cta_url}
            className="inline-flex w-fit rounded-lg bg-jid-gold px-4 py-2 text-sm font-semibold text-jid-ink hover:bg-jid-gold/90"
          >
            {announcement.cta_label_ar?.trim() || 'اعرف المزيد'}
          </a>
        ) : null}
      </div>
    </div>
  )
}

export function AnnouncementEmptyState() {
  return (
    <section
      role="status"
      aria-live="polite"
      className="flex min-h-[280px] items-center justify-center rounded-xl border border-jid-line bg-white p-8 text-center"
    >
      <div className="max-w-md space-y-3">
        <h3 className="text-lg font-semibold text-jid-ink">لا توجد إعلانات حالياً</h3>
        <p className="text-sm text-jid-ink/70">سيتم عرض أحدث إعلانات المنصة هنا بمجرد نشرها.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-jid-olive px-4 py-2 text-sm font-medium text-white hover:bg-jid-olive/90"
        >
          العودة للرئيسية
        </Link>
      </div>
    </section>
  )
}
