'use client'

import { useState } from 'react'
import { Loader2, Sparkles, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PlusGate } from '@/components/monetization/plus-gate'
import {
  refineCvBullets,
  suggestionIntroducedNewQuantification,
  type CvRefineTrack,
} from '@/lib/cv/refine-bullets-client'
import { TruthfulnessLock } from './truthfulness-lock'

type BulletRefinerProps = {
  bullets: string[]
  onApply: (nextBullets: string[]) => void
  className?: string
}

type PendingSuggestion = {
  index: number
  original: string
  suggestion: string
  needsTruthLock: boolean
}

/**
 * AI bullet refinement chips — accept / refine / reject (Prompt 1).
 */
export function BulletRefiner({ bullets, onApply, className }: BulletRefinerProps) {
  const t = useTranslations('cv.builder.refiner')
  const locale = useLocale() as 'ar' | 'en'
  const [track, setTrack] = useState<CvRefineTrack>('consulting')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<PendingSuggestion[]>([])
  const [truthLocks, setTruthLocks] = useState<Record<number, boolean>>({})

  async function handleRefine() {
    const source = bullets.map((b) => b.trim()).filter(Boolean)
    if (source.length === 0) return

    setLoading(true)
    try {
      const response = await refineCvBullets({
        track,
        language: locale === 'ar' ? 'ar' : 'en',
        bullets: source,
      })

      const nextPending: PendingSuggestion[] = []
      response.variants.forEach((variant, index) => {
        const suggestion = variant.suggestions[0]?.trim()
        if (!suggestion || suggestion === variant.original) return
        nextPending.push({
          index,
          original: variant.original,
          suggestion,
          needsTruthLock: suggestionIntroducedNewQuantification(variant.original, suggestion),
        })
      })

      setPending(nextPending)
      setTruthLocks({})

      if (process.env.NODE_ENV === 'development') {
        console.debug('[analytics]', 'cv_ai_refine_used', {
          track,
          bullet_count: source.length,
        })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error'))
    } finally {
      setLoading(false)
    }
  }

  function acceptSuggestion(item: PendingSuggestion) {
    if (item.needsTruthLock && !truthLocks[item.index]) {
      toast.error(t('truthLockRequired'))
      return
    }

    const next = [...bullets]
    next[item.index] = item.suggestion
    onApply(next)
    setPending((rows) => rows.filter((row) => row.index !== item.index))
  }

  function rejectSuggestion(item: PendingSuggestion) {
    setPending((rows) => rows.filter((row) => row.index !== item.index))
  }

  const refineBody = (
    <div className={cn('space-y-3 rounded-lg border border-border bg-card p-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden />
          <p className="font-arabic text-sm font-medium text-foreground">{t('title')}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(['consulting', 'pm', 'biz_ops'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTrack(value)}
              className={cn(
                'rounded-md border px-2 py-1 text-xs font-arabic transition-colors',
                track === value
                  ? 'border-accent bg-accent/20 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {t(`tracks.${value}`)}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="font-arabic"
        disabled={loading || bullets.every((b) => !b.trim())}
        onClick={() => void handleRefine()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {loading ? t('loading') : t('action')}
      </Button>

      {pending.length > 0 ? (
        <div className="space-y-3">
          {pending.map((item) => (
            <div key={`pending-${item.index}`} className="rounded-md border border-border/80 p-3">
              <p className="text-xs text-muted-foreground line-through">{item.original}</p>
              <p className="mt-1 text-sm text-foreground">{item.suggestion}</p>

              {item.needsTruthLock ? (
                <TruthfulnessLock
                  className="mt-3"
                  checked={Boolean(truthLocks[item.index])}
                  onCheckedChange={(checked) =>
                    setTruthLocks((prev) => ({ ...prev, [item.index]: checked }))
                  }
                />
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => acceptSuggestion(item)}>
                  {t('accept')}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void handleRefine()}>
                  {t('refineAgain')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => rejectSuggestion(item)}
                >
                  <X className="h-4 w-4" aria-hidden />
                  {t('reject')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )

  return <PlusGate feature="cv_pro_formats">{refineBody}</PlusGate>
}
