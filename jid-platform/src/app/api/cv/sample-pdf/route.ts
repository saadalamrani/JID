import { renderCvPdfBuffer } from '@/lib/cv/render-cv-pdf'
import { SAMPLE_CV_DATA } from '@/lib/cv/fixtures/sample-cv-data'

export const runtime = 'nodejs'

/** Dev-only sample PDF — Section 14 manual verification. */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 })
  }

  const bytes = await renderCvPdfBuffer(SAMPLE_CV_DATA)

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="cv-sample.pdf"',
      'Cache-Control': 'no-store',
    },
  })
}
