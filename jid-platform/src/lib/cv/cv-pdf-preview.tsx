'use client'

import { PDFViewer } from '@react-pdf/renderer'
import { CvDocument } from '@/lib/cv/pdf-document'
import type { CvData } from '@/types/cv'

type CvPdfPreviewProps = {
  data: CvData
}

/** Client-only live Harvard PDF preview (Section 7.3). */
export function CvPdfPreview({ data }: CvPdfPreviewProps) {
  return (
    <PDFViewer width="100%" height={640} showToolbar={false}>
      <CvDocument data={data} />
    </PDFViewer>
  )
}
