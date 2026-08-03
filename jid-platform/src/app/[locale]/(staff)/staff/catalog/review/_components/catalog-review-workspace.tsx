'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import type { CatalogReviewDetail } from '@/lib/staff/catalog-operations'
import { checkCatalogDomain, publishCatalogCandidate, reviewCatalogCandidate } from '../../actions'

export function CatalogReviewWorkspace({ detail }: { detail: CatalogReviewDetail }) {
  const t = useTranslations('staff.catalog')
  const [notes, setNotes] = useState('')
  const [domain, setDomain] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [assist, setAssist] = useState<Awaited<ReturnType<typeof checkCatalogDomain>> | null>(null)
  const [pending, startTransition] = useTransition()
  const legalName = String(
    detail.facts.find((fact) => fact.fact_key === 'legal_name')?.normalized_value ??
      detail.queue.candidate.normalized_identity,
  )

  const decide = (
    action: 'approve' | 'approve_pending_domain' | 'reject' | 'return' | 'validate_domain',
  ) =>
    startTransition(async () => {
      const response = await reviewCatalogCandidate({
        queueId: detail.queue.id,
        action,
        notes,
        domain: domain || undefined,
        evidenceUrl: evidenceUrl || undefined,
        nameAr: nameAr || undefined,
      })
      setResult(response.code)
    })
  const publish = () =>
    startTransition(async () => {
      const response = await publishCatalogCandidate(detail.queue.id)
      setResult(response.code)
    })
  const check = () =>
    startTransition(async () => setAssist(await checkCatalogDomain(domain, legalName)))

  return (
    <main className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{legalName}</h1>
          <Badge>{detail.queue.status}</Badge>
          <Badge>{detail.queue.candidate.match_outcome}</Badge>
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {detail.queue.candidate.lei ?? '—'}
        </p>
        {detail.viewOnly && (
          <p
            role="status"
            className="border-sem-warning/40 bg-sem-warning/10 mt-3 rounded-md border p-3 text-sm"
          >
            {t('viewOnly')}
          </p>
        )}
      </header>
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">{t('flags')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {detail.queue.candidate.review_flags.length ? (
            detail.queue.candidate.review_flags.map((flag) => <Badge key={flag}>{flag}</Badge>)
          ) : (
            <span className="text-sm text-muted-foreground">{t('none')}</span>
          )}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title={t('sourceEvidence')}>
          <dl className="space-y-2 text-sm">
            <Pair label={t('source')} value={detail.source.display_name} />
            <Pair label={t('checksum')} value={detail.evidence.checksum_sha256} mono />
            <Pair label={t('retrieved')} value={detail.evidence.retrieved_at} />
            <Pair label={t('retention')} value={detail.evidence.retention_state} />
          </dl>
          <pre
            className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs"
            dir="ltr"
          >
            {JSON.stringify(detail.evidence.source_payload, null, 2)}
          </pre>
        </Panel>
        <Panel title={t('comparison')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium">{t('candidate')}</h3>
              <p className="mt-2 text-sm">{legalName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">{t('directoryTarget')}</h3>
              {detail.target ? (
                <dl className="mt-2 space-y-2 text-sm">
                  <Pair label={t('name')} value={detail.target.name} />
                  <Pair label={t('city')} value={detail.target.city ?? '—'} />
                  <Pair label={t('domains')} value={detail.target.domains.join(', ') || '—'} />
                </dl>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{t('newRecord')}</p>
              )}
            </div>
          </div>
        </Panel>
      </section>
      <Panel title={t('facts')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <Th>{t('fact')}</Th>
                <Th>{t('normalized')}</Th>
                <Th>{t('sourceField')}</Th>
                <Th>{t('authority')}</Th>
                <Th>{t('reviewState')}</Th>
              </tr>
            </thead>
            <tbody>
              {detail.facts.map((fact) => (
                <tr key={fact.id} className="border-b border-border last:border-0">
                  <Td>{fact.fact_key}</Td>
                  <Td>
                    <code className="whitespace-pre-wrap break-all">
                      {JSON.stringify(fact.normalized_value)}
                    </code>
                  </Td>
                  <Td>{fact.source_field}</Td>
                  <Td>{fact.authority_level}</Td>
                  <Td>{fact.reviewer_edit_state}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={t('domainValidation')}>
        <p className="text-sm text-muted-foreground">{t('domainRule')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label={t('domain')} value={domain} onChange={setDomain} dir="ltr" />
          <Input label={t('evidenceUrl')} value={evidenceUrl} onChange={setEvidenceUrl} dir="ltr" />
          <Input label={t('arabicName')} value={nameAr} onChange={setNameAr} />
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">{t('notes')}</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 min-h-24 w-full rounded-md border border-input bg-background p-3"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={pending || !domain} onClick={check}>
            {t('runAssist')}
          </Button>
          <Button
            disabled={pending || detail.viewOnly || !domain || !evidenceUrl || notes.length < 10}
            onClick={() => decide('validate_domain')}
          >
            {t('validateDomain')}
          </Button>
        </div>
        {assist && (
          <pre
            role="status"
            className="mt-3 overflow-auto rounded-md bg-muted p-3 text-xs"
            dir="ltr"
          >
            {JSON.stringify(assist, null, 2)}
          </pre>
        )}
      </Panel>
      <Panel title={t('decision')}>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={pending || detail.viewOnly || notes.length < 10}
            onClick={() => decide('approve')}
          >
            {t('approve')}
          </Button>
          <Button
            disabled={pending || detail.viewOnly || notes.length < 10}
            onClick={() => decide('approve_pending_domain')}
          >
            {t('approvePendingDomain')}
          </Button>
          <Button
            disabled={pending || detail.viewOnly || notes.length < 10}
            onClick={() => decide('return')}
          >
            {t('return')}
          </Button>
          <Button
            disabled={pending || detail.viewOnly || notes.length < 10}
            onClick={() => decide('reject')}
          >
            {t('reject')}
          </Button>
          <Button
            disabled={pending || detail.viewOnly || detail.queue.status !== 'approved'}
            onClick={publish}
          >
            {t('publish')}
          </Button>
        </div>
        {result && (
          <p className="mt-3 text-sm" role="status">
            {result}
          </p>
        )}
      </Panel>
      <Panel title={t('auditHistory')}>
        {detail.audit.length ? (
          <ol className="space-y-3">
            {detail.audit.map((event) => (
              <li key={event.id} className="border-s-2 border-border ps-3 text-sm">
                <p className="font-medium">{event.action}</p>
                <p className="text-xs text-muted-foreground">{event.created_at}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">{t('noAudit')}</p>
        )}
      </Panel>
    </main>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs">{children}</span>
  )
}
function Pair({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? 'break-all font-mono text-xs' : 'break-words'}>{value}</dd>
    </div>
  )
}
function Input({
  label,
  value,
  onChange,
  dir,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  dir?: 'ltr'
}) {
  return (
    <label>
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        dir={dir}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
      />
    </label>
  )
}
function Button({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-2 py-2 text-start font-medium">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-2 align-top">{children}</td>
}
