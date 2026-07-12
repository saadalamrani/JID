import { NextResponse } from 'next/server'
import { z } from 'zod'
import { trackServer } from '@/lib/analytics/server'
import { getApprovedCompanyPoster } from '@/lib/jobs/company-access'
import { createCompanyJob } from '@/lib/jobs/create-company-job'
import { validateDomainMatch } from '@/lib/queries/jobs'
import { jobPostingSchema } from '@/lib/validations/job-posting'

export async function POST(request: Request) {
  try {
    const poster = await getApprovedCompanyPoster()
    if (!poster) {
      return NextResponse.json({ error: 'غير مصرح لك بنشر الفرص' }, { status: 403 })
    }

    const body = jobPostingSchema.parse(await request.json())

    if (!poster.businessProfileId) {
      return NextResponse.json(
        { error: 'يجب إنشاء ملفك التعريفي المعتمد قبل نشر فرص جديدة' },
        { status: 403 },
      )
    }

    const domainCheck = await validateDomainMatch(
      body.external_apply_url,
      poster.businessProfileId,
      'ar',
    )
    if (!domainCheck.valid) {
      return NextResponse.json({ error: domainCheck.message }, { status: 400 })
    }

    const result = await createCompanyJob(poster, body)
    void trackServer('job_posted', poster.userId, {
      job_id: result.jobId,
      status: result.status,
      publish: body.publish,
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : 'تعذّر حفظ الفرصة'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
