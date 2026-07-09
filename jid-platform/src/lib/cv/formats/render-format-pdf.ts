'use client'

import React, { type ReactElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import { CvDocument } from '@/lib/cv/pdf-document'
import { GlobalAtsDocument } from '@/lib/cv/formats/global-ats-document'
import { HarvardDocument } from '@/lib/cv/formats/harvard-document'
import { registerCvPdfFonts } from '@/lib/cv/formats/pdf-fonts'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import { formatRequiresPlus } from '@/lib/cv/formats/registry'
import type { CvData } from '@/types/cv'

function buildDocumentElement(format: CvExportFormatKey, data: CvData): ReactElement {
  switch (format) {
    case 'harvard':
      return React.createElement(HarvardDocument, { data })
    case 'global_ats':
      return React.createElement(GlobalAtsDocument, { data })
    case 'basic_free':
    default:
      return React.createElement(CvDocument, { data })
  }
}

/** Client-side PDF blob — never posts document content to any API (PDPL). */
export async function renderCvFormatPdfBlob(
  format: CvExportFormatKey,
  data: CvData,
): Promise<Blob> {
  if (formatRequiresPlus(format)) {
    registerCvPdfFonts()
  }

  const element = buildDocumentElement(format, data)
  return pdf(element).toBlob()
}

export function getCvFormatDocumentComponent(format: CvExportFormatKey) {
  switch (format) {
    case 'harvard':
      return HarvardDocument
    case 'global_ats':
      return GlobalAtsDocument
    case 'basic_free':
    default:
      return CvDocument
  }
}

/** Session storage key for AR print-CSS handoff — client-only, ephemeral. */
export const CV_PRINT_AR_SESSION_KEY = 'jid:cv-print-ar'

export function stashCvDataForArPrint(data: CvData): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CV_PRINT_AR_SESSION_KEY, JSON.stringify(data))
}

export function readCvDataFromArPrintSession(): CvData | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(CV_PRINT_AR_SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CvData
  } catch {
    return null
  }
}

export function clearCvArPrintSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(CV_PRINT_AR_SESSION_KEY)
}
