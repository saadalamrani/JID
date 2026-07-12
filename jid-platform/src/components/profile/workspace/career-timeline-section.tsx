'use client'

import { useMemo, useState } from 'react'
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Handshake,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type {
  CareerTimelineEntry,
  CareerTimelineEntryKind,
} from '@/lib/profile/career-timeline'
import { cn } from '@/lib/utils'

const KIND_ICONS: Record<CareerTimelineEntryKind, typeof GraduationCap> = {
  education: GraduationCap,
  experience: Briefcase,
  application: FileText,
  mentorship: Handshake,
  profile_milestone: ShieldCheck,
}

const INITIAL_VISIBLE = 4

type CareerTimelineSectionProps = {
  entries: CareerTimelineEntry[]
  kinds: CareerTimelineEntryKind[]
  isOwner: boolean
  evidenceVaultAvailable: boolean
}

export function CareerTimelineSection({
  entries,
  kinds,
  isOwner,
  evidenceVaultAvailable,
}: CareerTimelineSectionProps) {
  const t = useTranslations('profile.workspace.timeline')
  const [activeKinds, setActiveKinds] = useState<CareerTimelineEntryKind[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    if (activeKinds.length === 0) return entries
    const allowed = new Set(activeKinds)
    return entries.filter((e) => allowed.has(e.kind))
  }, [entries, activeKinds])

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE)

  function toggleKind(kind: CareerTimelineEntryKind) {
    setActiveKinds((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind],
    )
  }

  if (entries.length === 0) {
    if (!isOwner) return null
    return (
      <section id="profile-section-timeline" className="scroll-mt-24">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t('emptyOwner')}
        </p>
      </section>
    )
  }

  return (
    <section id="profile-section-timeline" className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>

      {kinds.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {kinds.map((kind) => {
            const active = activeKinds.length === 0 || activeKinds.includes(kind)
            return (
              <button
                key={kind}
                type="button"
                onClick={() => toggleKind(kind)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  activeKinds.includes(kind)
                    ? 'border-primary bg-primary/10 text-primary'
                    : active
                      ? 'border-border text-muted-foreground hover:border-primary/40'
                      : 'border-border bg-muted/50 text-muted-foreground',
                )}
              >
                {t(`kinds.${kind}`)}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="space-y-3">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            {t('empty')}
          </p>
        ) : (
          visible.map((entry) => {
            const Icon = KIND_ICONS[entry.kind]
            const isExpanded = expandedId === entry.id
            return (
              <article
                key={entry.id}
                className="rounded-xl border border-border bg-card shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-3 p-4 text-start"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{entry.title}</span>
                    {entry.subtitle ? (
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {entry.subtitle}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {new Date(entry.occurredAt).toLocaleDateString()}
                    </span>
                  </span>
                  {entry.hasProof ? (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-primary">
                      {t('proof')}
                    </span>
                  ) : null}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                </button>

                {isExpanded ? (
                  <div className="border-t border-border px-4 pb-4 pt-2 text-sm text-muted-foreground">
                    {entry.description ? <p>{entry.description}</p> : null}
                    {!evidenceVaultAvailable && isOwner ? (
                      <p className="mt-2 text-xs text-muted-foreground">{t('evidenceUnavailable')}</p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })
        )}
      </div>

      {filtered.length > INITIAL_VISIBLE ? (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-primary hover:underline"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? t('showLess') : t('showMore')}
        </button>
      ) : null}
    </section>
  )
}
