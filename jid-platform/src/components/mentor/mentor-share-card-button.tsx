'use client'

import { useRef, useState } from 'react'
import { Loader2, Share2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { CrownBadge } from '@/components/mentor/crown-badge'
import { track } from '@/lib/analytics/track'

type MentorShareCardProps = {
  name: string
  headline: string | null
  avatarUrl: string | null
  ratingAvg: number | null
  sessionsCount: number
  expertiseAreas: string[]
  slug: string | null
  isMentorOfMonth: boolean
}

/**
 * Section 4.16 — 1200×630 Open Graph share card (client-side html-to-image).
 * Chosen over Edge Function: no headless browser infra; mentor downloads locally.
 */
export function MentorShareCardButton({
  name,
  headline,
  avatarUrl,
  ratingAvg,
  sessionsCount,
  expertiseAreas,
  slug,
  isMentorOfMonth,
}: MentorShareCardProps) {
  const t = useTranslations('mentorship.share')
  const locale = useLocale()
  const cardRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  async function handleDownload() {
    if (!cardRef.current || generating) return
    setGenerating(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 1,
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.download = `jid-mentor-${slug ?? 'profile'}.png`
      link.href = dataUrl
      link.click()
      track('mentor_share_card_downloaded', { slug })
      toast.success(t('downloadSuccess'))
    } catch {
      toast.error(t('downloadError'))
    } finally {
      setGenerating(false)
    }
  }

  const tags = expertiseAreas.slice(0, 3)

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        className="font-arabic"
        disabled={generating}
        onClick={() => void handleDownload()}
      >
        {generating ? (
          <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Share2 className="me-2 h-4 w-4" aria-hidden />
        )}
        {t('downloadCta')}
      </Button>

      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
        <div
          ref={cardRef}
          className="flex h-[630px] w-[1200px] flex-col justify-between bg-gradient-to-br from-primary to-primary/80 p-12 text-primary-foreground"
        >
          <div className="flex items-start justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <ProfileAvatar src={avatarUrl} alt={name} size="lg" variant="circle" />
                {isMentorOfMonth ? (
                  <span className="absolute -bottom-2 -end-2 scale-125">
                    <CrownBadge />
                  </span>
                ) : null}
              </div>
              <div>
                <p className="text-sm uppercase tracking-widest text-accent">JID Mentorship</p>
                <h1 className="mt-2 text-5xl font-bold">{name}</h1>
                {headline ? <p className="mt-3 max-w-2xl text-2xl text-primary-foreground/85">{headline}</p> : null}
              </div>
            </div>
            <div className="rounded-2xl bg-card/10 px-6 py-4 text-end">
              {ratingAvg != null ? (
                <p className="text-4xl font-bold text-accent">{ratingAvg.toFixed(1)}</p>
              ) : null}
              <p className="mt-1 text-lg text-primary-foreground/80">
                {t('sessions', { count: sessionsCount })}
              </p>
            </div>
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-card/15 px-5 py-2 text-xl font-medium backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-lg text-primary-foreground/70">
            {locale === 'ar' ? 'انضم إلى منصة جيد للإرشاد المهني' : 'Join JID mentorship platform'}
          </p>
        </div>
      </div>
    </div>
  )
}
