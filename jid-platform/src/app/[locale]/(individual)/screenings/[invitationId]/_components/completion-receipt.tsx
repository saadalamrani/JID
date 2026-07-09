'use client'

import { CheckCircle2 } from 'lucide-react'
import { SSIS_AI_DISCLAIMER_AR } from '@/lib/ssis/constants'

export function CompletionReceipt() {
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-6 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
      <h2 className="mt-3 font-arabic text-lg font-semibold text-foreground">تم إرسال إجاباتك</h2>
      <p className="mt-2 font-arabic text-sm text-muted-foreground">
        سيُقيَّم فحصك وفق المعايير المعلنة. ستظهر ملخص النتيجة في الرادار عند الجاهزية.
      </p>
      <p className="mt-3 font-arabic text-xs text-muted-foreground">{SSIS_AI_DISCLAIMER_AR}</p>
      <p className="mt-2 font-arabic text-xs font-medium text-foreground">
        نضمن إبلاغك بالنتيجة عبر الرادار — القرار النهائي بشري.
      </p>
    </section>
  )
}
