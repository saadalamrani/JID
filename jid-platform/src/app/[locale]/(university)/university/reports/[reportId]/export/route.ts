import { NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { buildUniversityReportCsv } from '@/lib/university/wave12-export'
import { fetchUniversityReportExportPayload } from '@/lib/university/wave12-queries'

export async function GET(
  _request: Request,
  context: { params: { reportId: string } },
): Promise<Response> {
  await requireAuthenticatedUser()
  const payload = await fetchUniversityReportExportPayload(context.params.reportId)
  if (!payload.ok) {
    return new NextResponse(null, { status: 404 })
  }

  const csv = buildUniversityReportCsv(payload)
  const filename = `jid-university-report-${payload.report_id ?? context.params.reportId}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
