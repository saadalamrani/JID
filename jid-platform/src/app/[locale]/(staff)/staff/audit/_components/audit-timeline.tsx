'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { getAuditCatalogEntry } from '@/lib/sys/audit-catalog'
import type { StaffAuditEvent } from '@/types/staff-audit'
import { cn } from '@/lib/utils'

type AuditTimelineProps = {
  events: StaffAuditEvent[]
}

function staffEntityHref(entityType: string, entityId: string | null): string | null {
  if (!entityId) return null
  switch (entityType) {
    case 'profile':
    case 'user':
      return `/staff/users/${entityId}`
    case 'company':
    case 'entity':
      return `/staff/entities/${entityId}`
    case 'claim':
    case 'claim_request':
      return `/staff/claims/${entityId}`
    case 'content_flag':
      return `/staff/moderation/${entityId}`
    default:
      return null
  }
}

function formatTarget(event: StaffAuditEvent): string {
  const parts = [event.entity_type]
  if (event.entity_id) parts.push(event.entity_id)
  return parts.join(' · ')
}

function formatChanges(event: StaffAuditEvent): string {
  return JSON.stringify({ before: event.old_data, after: event.new_data }, null, 2)
}

function AuditEventRow({ event }: { event: StaffAuditEvent }) {
  const t = useTranslations('staff.audit.row')
  const [expanded, setExpanded] = useState(false)
  const catalog = getAuditCatalogEntry(event.action)
  const Icon = catalog.icon
  const reason =
    typeof event.metadata.reason === 'string' ? event.metadata.reason : null
  const href = staffEntityHref(event.entity_type, event.entity_id)

  return (
    <article className="rounded-lg border border-jid-line bg-white p-4">
      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-jid-beige/70 text-jid-olive"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-jid-ink">{catalog.label}</p>
              <p className="font-mono text-xs text-jid-ink/45">{event.action}</p>
            </div>
            <time dateTime={event.created_at} className="text-xs text-jid-ink/45">
              {new Date(event.created_at).toLocaleString()}
            </time>
          </div>

          <p className="mt-2 text-sm text-jid-ink/70">
            <span className="font-medium text-jid-ink/50">{t('target')}: </span>
            {href ? (
              <Link href={href} className="text-jid-olive hover:underline">
                {formatTarget(event)}
              </Link>
            ) : (
              formatTarget(event)
            )}
          </p>

          {reason ? (
            <blockquote className="mt-3 border-s-2 border-jid-olive/40 ps-3 text-sm italic text-jid-ink/75">
              {reason}
            </blockquote>
          ) : null}

          {event.old_data || event.new_data ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className={cn('text-sm text-jid-olive hover:underline')}
              >
                {expanded ? t('hideChanges') : t('showChanges')}
              </button>
              {expanded ? (
                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-jid-beige/40 p-3 text-xs text-jid-ink/80">
                  {formatChanges(event)}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/** Section 11 — personal audit timeline (actor-scoped events only). */
export function AuditTimeline({ events }: AuditTimelineProps) {
  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li key={event.id}>
          <AuditEventRow event={event} />
        </li>
      ))}
    </ul>
  )
}
