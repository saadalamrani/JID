import type { CvData } from '@/types/cv'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import { renderCvFormatPdfBlob } from '@/lib/cv/formats/render-format-pdf'

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
export async function estimatePageCount(
  data: CvData,
  format: CvExportFormatKey = 'basic_free',
): Promise<number> {
  const blob = await renderCvFormatPdfBlob(format, data)
  return countPdfPagesFromBlob(blob)
}
