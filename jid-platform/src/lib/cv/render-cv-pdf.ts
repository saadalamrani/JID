import 'server-only'

import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { CvDocument } from '@/lib/cv/pdf-document'
import type { CvData } from '@/types/cv'

export async function renderCvPdfBuffer(data: CvData): Promise<Uint8Array> {
  const buffer = await renderToBuffer(
    React.createElement(CvDocument, { data }) as React.ReactElement,
  )
  return new Uint8Array(buffer)
}
