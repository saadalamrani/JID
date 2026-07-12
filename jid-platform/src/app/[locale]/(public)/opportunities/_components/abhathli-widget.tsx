'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, Plus, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import {
  markMandateMatchesSeen,
  updateSearchMandate,
} from '@/app/[locale]/(public)/opportunities/abhathli-actions'
import { PlusGate } from '@/components/monetization/plus-gate'
import { Button } from '@/components/ui/button'
import {
  abhathliMandatesQueryKey,
  abhathliMatchesQueryKey,
} from '@/lib/abhathli/client'
import { ABHATHLI_MAX_ACTIVE_MANDATES } from '@/lib/abhathli/constants'
import {
  useAbhathliUnseenCount,
  useMandateMatches,
  useSearchMandates,
} from '@/lib/hooks/use-abhathli'
import { cn } from '@/lib/utils'
import { AbhathliTeaser } from './abhathli-teaser'
import { MandateCard } from './mandate-card'
import { MandateSheet } from './mandate-sheet'
import { MatchStrip } from './match-strip'

function AbhathliWidgetUnlocked() {
  const t = useTranslations('opportunities.abhathli')
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const { data: mandates = [], isLoading: mandatesLoading } = useSearchMandates()
  const { data: matches = [] } = useMandateMatches()
  const { data: unseenCount = 0 } = useAbhathliUnseenCount()

  const activeMandates = mandates.filter((m) => m.isActive)
  const visibleMatches = matches.filter((m) => !m.dismissedAt).slice(0, 12)

  const handleExpand = () => {
    const next = !expanded
    setExpanded(next)
    if (next && unseenCount > 0) {
      startTransition(async () => {
        await markMandateMatchesSeen()
        await queryClient.invalidateQueries({ queryKey: ['abhathli', 'unseen-count'] })
        await queryClient.invalidateQueries({ queryKey: abhathliMatchesQueryKey() })
      })
    }
    if (next && process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'abhathli_match_served', { count: visibleMatches.length })
    }
  }

  const handleToggleMandate = (mandateId: string, active: boolean) => {
    startTransition(async () => {
      const result = await updateSearchMandate(mandateId, { isActive: active })
      if (!result.ok) window.alert(result.error)
      await queryClient.invalidateQueries({ queryKey: abhathliMandatesQueryKey() })
    })
  }

  if (mandatesLoading) {
    return <div className="mb-4 h-14 animate-pulse rounded-xl bg-muted/50" aria-busy="true" />
  }

  if (activeMandates.length === 0) {
    return (
      <>
        <section className="mb-4 rounded-xl border border-accent/30 bg-card px-4 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-arabic text-base font-semibold text-foreground">
                {mandates.length > 0 ? t('pausedTitle') : t('inviteTitle')}
              </h2>
              <p className="mt-1 font-arabic text-sm text-muted-foreground">
                {mandates.length > 0 ? t('pausedBody') : t('inviteBody')}
              </p>
            </div>
            <Button
              type="button"
              className="font-arabic"
              onClick={() => setSheetOpen(true)}
              disabled={activeMandates.length >= ABHATHLI_MAX_ACTIVE_MANDATES}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('createMandate')}
            </Button>
          </div>
          {mandates.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {mandates.map((mandate) => (
                <MandateCard
                  key={mandate.id}
                  mandate={mandate}
                  onToggleActive={handleToggleMandate}
                  pending={pending}
                />
              ))}
            </div>
          ) : null}
        </section>
        <MandateSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          activeMandateCount={mandates.filter((m) => m.isActive).length}
        />
      </>
    )
  }

  return (
    <>
      <section className="mb-4 rounded-xl border border-border/60 bg-card shadow-sm">
        <button
          type="button"
          onClick={handleExpand}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start"
          aria-expanded={expanded}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="font-arabic text-sm font-semibold text-foreground">
              {t('collapsedLabel', { count: unseenCount })}
            </span>
            {unseenCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 font-arabic text-xs font-semibold text-primary-foreground">
                {unseenCount}
              </span>
            ) : null}
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
        </button>

        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200',
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 border-t border-border/50 px-4 py-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {mandates.map((mandate) => (
                  <MandateCard
                    key={mandate.id}
                    mandate={mandate}
                    onToggleActive={handleToggleMandate}
                    pending={pending}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-arabic text-xs text-muted-foreground">{t('mandatesHint')}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="font-arabic"
                  onClick={() => setSheetOpen(true)}
                  disabled={activeMandates.length >= ABHATHLI_MAX_ACTIVE_MANDATES}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  {t('addMandate')}
                </Button>
              </div>

              <MatchStrip matches={visibleMatches} />
            </div>
          </div>
        </div>
      </section>

      <MandateSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        activeMandateCount={activeMandates.length}
      />
    </>
  )
}

export function AbhathliWidget() {
  return (
    <PlusGate feature="search_for_me" fallback={<AbhathliTeaser className="mb-4" />}>
      <AbhathliWidgetUnlocked />
    </PlusGate>
  )
}
