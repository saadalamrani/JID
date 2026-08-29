'use client'

import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import {
  addRadarActionAction,
  addRadarInterviewAction,
  addRadarNoteAction,
  completeRadarActionAction,
  declareExternalAppliedAction,
  recordRadarOutcomeAction,
} from '@/app/[locale]/(individual)/radar/actions'
import { CAREER_ACTION_KINDS, CAREER_OUTCOME_KINDS, type CareerItem } from '@/lib/career-operations/types'
import { careerItemTitle, formatRiyadhDate } from '@/lib/career-operations/display'

type RadarItemWorkspaceProps = {
  item: CareerItem
  notes: { id: string; body: string; created_at: string }[]
}

export function RadarItemWorkspace({ item, notes }: RadarItemWorkspaceProps) {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('radar.operations')
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const title = careerItemTitle(item, locale)

  return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        description={item.organization_name ?? undefined}
        breadcrumb={
          <Link href="/radar" className="text-sm text-muted-foreground hover:underline">
            {t('backToRadar')}
          </Link>
        }
      />

      <p className="text-sm text-muted-foreground">
        {t(`states.${item.operational_state}`)}
        {item.source_class === 'GOVERNED_EXTERNAL' ? ` · ${t('externalNotice')}` : null}
      </p>

      {message ? (
        <p className="text-sm text-foreground" role="status">
          {message}
        </p>
      ) : null}

      <section className="space-y-3">
        <SectionHeader title={t('journey')} />
        {item.latest_events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('emptyEvents')}</p>
        ) : (
          <ol className="space-y-2">
            {item.latest_events.map((event) => (
              <li key={event.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium text-foreground">{event.summary}</p>
                <p className="text-muted-foreground">
                  {t(`actors.${event.actor_kind}`)} · {formatRiyadhDate(event.occurred_at, locale)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('notes')} />
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            const body = String(new FormData(form).get('body') ?? '')
            startTransition(async () => {
              const result = await addRadarNoteAction({ itemId: item.id, body })
              setMessage(result.ok ? t('saved') : result.error)
              if (result.ok) form.reset()
            })
          }}
        >
          <Textarea name="body" required minLength={1} rows={4} aria-label={t('notes')} />
          <Button type="submit" disabled={pending} className="min-h-11">
            {t('addNote')}
          </Button>
        </form>
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border border-border p-3 text-sm whitespace-pre-wrap">
              {note.body}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('nextAction')} />
        {item.next_action && !item.next_action.completed_at ? (
          <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              {item.next_action.label}
              {item.next_action.due_at ? ` — ${formatRiyadhDate(item.next_action.due_at, locale)}` : null}
            </p>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await completeRadarActionAction({ actionId: item.next_action!.id })
                  setMessage(result.ok ? t('saved') : result.error)
                })
              }}
            >
              {t('completeAction')}
            </Button>
          </div>
        ) : null}
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            startTransition(async () => {
              const result = await addRadarActionAction({
                itemId: item.id,
                kind: String(form.get('kind')) as (typeof CAREER_ACTION_KINDS)[number],
                label: String(form.get('label') ?? ''),
                dueAt: String(form.get('dueAt') ?? '') || null,
                isFollowUp: form.get('followUp') === 'on',
              })
              setMessage(result.ok ? t('saved') : result.error)
            })
          }}
        >
          <label className="text-sm sm:col-span-2">
            {t('actionLabel')}
            <Input name="label" required className="mt-1" />
          </label>
          <label className="text-sm">
            {t('actionKind')}
            <select
              name="kind"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="follow_up"
            >
              {CAREER_ACTION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`actionKinds.${kind}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t('dueAt')}
            <Input name="dueAt" type="datetime-local" className="mt-1" />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="followUp" className="h-4 w-4" />
            {t('markFollowUp')}
          </label>
          <Button type="submit" disabled={pending} className="min-h-11 sm:col-span-2">
            {t('addAction')}
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('interview')} />
        <ul className="space-y-2">
          {item.interviews.map((interview) => (
            <li key={interview.id} className="rounded-md border border-border p-3 text-sm">
              {formatRiyadhDate(interview.scheduled_at, locale)}
              {interview.location_or_mode ? ` · ${interview.location_or_mode}` : null}
            </li>
          ))}
        </ul>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            startTransition(async () => {
              const result = await addRadarInterviewAction({
                itemId: item.id,
                scheduledAt: new Date(String(form.get('scheduledAt'))).toISOString(),
                locationOrMode: String(form.get('mode') ?? '') || null,
              })
              setMessage(result.ok ? t('saved') : result.error)
            })
          }}
        >
          <label className="text-sm">
            {t('interviewAt')}
            <Input name="scheduledAt" type="datetime-local" required className="mt-1" />
          </label>
          <label className="text-sm">
            {t('interviewMode')}
            <Input name="mode" className="mt-1" />
          </label>
          <Button type="submit" disabled={pending} className="min-h-11 sm:col-span-2">
            {t('addInterview')}
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('outcome')} />
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            const outcome = String(new FormData(event.currentTarget).get('outcome'))
            startTransition(async () => {
              const result = await recordRadarOutcomeAction({
                itemId: item.id,
                outcome: outcome as (typeof CAREER_OUTCOME_KINDS)[number],
              })
              setMessage(result.ok ? t('saved') : result.error)
            })
          }}
        >
          <select
            name="outcome"
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-xs"
            defaultValue="no_response"
          >
            {CAREER_OUTCOME_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(`outcomes.${kind}`)}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={pending} className="min-h-11">
            {t('saveOutcome')}
          </Button>
        </form>
      </section>

      {item.source_class === 'GOVERNED_EXTERNAL' ? (
        <section className="space-y-3">
          <SectionHeader title={t('externalApply')} description={t('externalNotice')} />
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await declareExternalAppliedAction({ itemId: item.id })
                setMessage(result.ok ? t('saved') : result.error)
              })
            }}
          >
            {t('declareExternal')}
          </Button>
        </section>
      ) : null}
    </div>
  )
}
