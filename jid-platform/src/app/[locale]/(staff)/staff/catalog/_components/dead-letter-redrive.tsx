'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { redriveCatalogDeadLetter } from '../actions'

export function DeadLetterRedrive({ id, allowed }: { id: string; allowed: boolean }) {
  const t = useTranslations('staff.catalog')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)
  if (!allowed) return null
  return (
    <div className="mt-3">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => setResult((await redriveCatalogDeadLetter(id)).code))
        }
        className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
      >
        {t('redrive')}
      </button>
      {result && (
        <span role="status" className="ms-3 text-xs">
          {result}
        </span>
      )}
    </div>
  )
}
