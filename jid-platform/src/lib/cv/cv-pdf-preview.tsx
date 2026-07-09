'use client'

import { useEffect, useMemo } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import { registerCvPdfFonts } from '@/lib/cv/formats/pdf-fonts'
import { getCvFormatDocumentComponent } from '@/lib/cv/formats/render-format-pdf'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import { formatRequiresPlus } from '@/lib/cv/formats/registry'
import type { CvData } from '@/types/cv'

type CvFormatPdfPreviewProps = {
  data: CvData
  format: CvExportFormatKey
}

/** Client-only live PDF preview — format-aware (Prompt 1). */
export function CvFormatPdfPreview({ data, format }: CvFormatPdfPreviewProps) {
  const DocumentComponent = useMemo(() => getCvFormatDocumentComponent(format), [format])

  useEffect(() => {
    if (formatRequiresPlus(format)) {
      registerCvPdfFonts()
    }
  }, [format])

  return (
    <PDFViewer width="100%" height={640} showToolbar={false}>
      <DocumentComponent data={data} />
    </PDFViewer>
  )
}

/** @deprecated Use CvFormatPdfPreview */
export function CvPdfPreview({ data }: { data: CvData }) {
  const DocumentComponent = getCvFormatDocumentComponent('basic_free')
  return (
    <PDFViewer width="100%" height={640} showToolbar={false}>
      <DocumentComponent data={data} />
    </PDFViewer>
  )
}
