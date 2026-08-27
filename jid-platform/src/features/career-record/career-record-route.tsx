'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

import { isValidLocale, localeDirection, type Locale } from '@/lib/i18n/config'
import { CareerRecordView } from './components/career-record-view'
import { getCareerRecordCopy } from './copy'
import { boundCareerRecordPort } from './port'
import type { CareerRecordViewState } from './view-state'

function mapListResult(
  result: Awaited<ReturnType<typeof boundCareerRecordPort.listCareerEvidence>>,
): CareerRecordViewState {
  switch (result.status) {
    case 'unavailable':
      return { status: 'unavailable' }
    case 'forbidden':
      return { status: 'forbidden' }
    case 'error':
      return { status: 'error', message: result.message }
    case 'stale':
      return result.data.length === 0
        ? { status: 'empty' }
        : { status: 'stale', items: result.data, asOfLabel: result.asOf }
    case 'ok':
      return result.data.length === 0
        ? { status: 'empty' }
        : { status: 'ready', items: result.data }
  }
}

export function CareerRecordRoute() {
  const localeValue = useLocale()
  const locale: Locale = isValidLocale(localeValue) ? localeValue : 'ar'
  const copy = getCareerRecordCopy(locale)
  const [state, setState] = useState<CareerRecordViewState>({ status: 'loading' })

  const load = useCallback(async () => {
    const result = await boundCareerRecordPort.listCareerEvidence()
    setState(mapListResult(result))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <CareerRecordView
      state={state}
      copy={copy}
      locale={locale}
      dir={localeDirection[locale]}
      onRetry={() => {
        void load()
      }}
      onCreateDeclared={(payload) => {
        void boundCareerRecordPort.createDeclaredCareerEvidence(payload).then((result) => {
          if (result.status === 'ok' || result.status === 'stale') {
            void load()
            return
          }
          setState(mapListResult(result))
        })
      }}
      onRevise={(payload) => {
        void boundCareerRecordPort.reviseCareerEvidence(payload).then((result) => {
          if (result.status === 'ok' || result.status === 'stale') {
            void load()
            return
          }
          setState(mapListResult(result))
        })
      }}
      onLifecycle={(payload) => {
        void boundCareerRecordPort.setCareerEvidenceLifecycle(payload).then((result) => {
          if (result.status === 'ok' || result.status === 'stale') {
            void load()
            return
          }
          setState(mapListResult(result))
        })
      }}
    />
  )
}
