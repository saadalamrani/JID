import type { ReactElement } from 'react'
import type { CvData } from '@/types/cv'

/** Parse page count from a PDF binary (react-pdf output). */
export function countPdfPagesFromBytes(bytes: Uint8Array): number {
  const text = new TextDecoder('latin1').decode(bytes)

  const countMatch = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/)
  if (countMatch) {
    const count = Number(countMatch[1])
    if (Number.isFinite(count) && count > 0) return count
  }

  const pageMarkers = text.match(/\/Type\s*\/Page\b/g)
  return pageMarkers?.length ?? 1
}

export async function countPdfPagesFromBlob(blob: Blob): Promise<number> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return countPdfPagesFromBytes(bytes)
}

/**
 * Section 7.12 — exact page count by rendering to a temporary PDF buffer.
 * react-pdf has no live estimator; we measure the generated document.
 */
export async function estimatePageCount(data: CvData): Promise<number> {
  const [{ pdf }, React, { CvDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('react'),
    import('@/lib/cv/pdf-document'),
  ])

  const blob = await pdf(
    React.createElement(CvDocument, { data }) as ReactElement,
  ).toBlob()
  return countPdfPagesFromBlob(blob)
}
