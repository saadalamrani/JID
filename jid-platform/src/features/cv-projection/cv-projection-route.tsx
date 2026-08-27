'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

import { isValidLocale, localeDirection, type Locale } from '@/lib/i18n/config'
import { useRouter } from '@/lib/i18n/navigation'
import { CvProjectionView, type CvProjectionViewState } from './components/cv-projection-view'
import { getCvProjectionCopy } from './copy'
import { boundCvProjectionPort } from './port'

function mapProjectionResult(
  result: Awaited<ReturnType<typeof boundCvProjectionPort.getCvProjection>>,
): CvProjectionViewState {
  switch (result.status) {
    case 'unavailable':
      return { status: 'unavailable' }
    case 'forbidden':
      return { status: 'forbidden' }
    case 'error':
      return { status: 'error', message: result.message }
    case 'stale':
      return { status: 'stale', projection: result.data, asOfLabel: result.asOf }
    case 'ok':
      return { status: 'ready', projection: result.data }
  }
}

export function CvProjectionRoute() {
  const localeValue = useLocale()
  const locale: Locale = isValidLocale(localeValue) ? localeValue : 'ar'
  const router = useRouter()
  const copy = getCvProjectionCopy(locale)
  const [state, setState] = useState<CvProjectionViewState>({ status: 'loading' })
  const [shareMessage, setShareMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    const result = await boundCvProjectionPort.getCvProjection()
    setState(mapProjectionResult(result))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const projectionId =
    state.status === 'ready' || state.status === 'stale' ? state.projection.cv_id : null

  return (
    <CvProjectionView
      state={state}
      copy={copy}
      locale={locale}
      dir={localeDirection[locale]}
      shareMessage={shareMessage}
      onRetry={() => {
        void load()
      }}
      onUpdatePresentation={(patch) => {
        if (!projectionId) return
        void boundCvProjectionPort.updateCvPresentation(projectionId, patch).then((result) => {
          if (result.status === 'ok' || result.status === 'stale') {
            setState(mapProjectionResult(result))
            return
          }
          if (result.status === 'unavailable') {
            setShareMessage(copy.unavailableMessage)
          }
        })
      }}
      onSetSelection={(sectionKey, orderedEvidenceIds) => {
        if (!projectionId) return
        void boundCvProjectionPort
          .setCvEvidenceSelection({
            cv_id: projectionId,
            section_key: sectionKey,
            ordered_evidence_ids: orderedEvidenceIds,
          })
          .then((result) => {
            if (result.status === 'ok' || result.status === 'stale') {
              setState(mapProjectionResult(result))
            }
          })
      }}
      onRequestFactCorrection={() => {
        router.push('/profile/career-record')
      }}
      onRequestShare={() => {
        if (!projectionId) {
          setShareMessage(copy.shareUnavailable)
          return
        }
        void boundCvProjectionPort
          .createCvSnapshot({ cv_id: projectionId, purpose: 'PUBLIC_SHARE' })
          .then((result) => {
            if (result.status === 'ok') {
              void load()
              return
            }
            setShareMessage(copy.shareUnavailable)
          })
      }}
    />
  )
}
