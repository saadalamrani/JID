import { Building2, Sparkles } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'

type EmptyUniversityStateProps = {
  title?: string
  description?: string
  ctaHref?: string
  ctaLabel?: string
}

export function EmptyUniversityState({
  title = 'لا توجد بيانات كافية حالياً',
  description = 'ابدأ بتحديث ملف الجامعة واستكمال بيانات الطلاب لعرض مؤشرات لوحة الإحصاءات.',
  ctaHref = '/company/profile',
  ctaLabel = 'الانتقال إلى ملف الجامعة',
}: EmptyUniversityStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-jid-gold/60 bg-jid-beige/60 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-jid-olive shadow-sm">
        <Building2 className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-jid-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-jid-ink/70">{description}</p>

      <Link
        href={ctaHref}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-jid-olive px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" />
        {ctaLabel}
      </Link>
    </section>
  )
}
