'use client'

import React, { type ReactElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import { CvDocument } from '@/lib/cv/pdf-document'
import { buildExportFilename } from '@/lib/cv/can-export'
import type { CvData } from '@/types/cv'

export async function renderCvPdfBlob(data: CvData): Promise<Blob> {
  return pdf(React.createElement(CvDocument, { data }) as ReactElement).toBlob()
}

export function downloadCvPdfBlob(blob: Blob, fullName: string): void {
  const filename = buildExportFilename(fullName)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
