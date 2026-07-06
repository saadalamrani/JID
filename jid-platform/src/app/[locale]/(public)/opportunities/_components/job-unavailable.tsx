import { Link as LocaleLink } from '@/lib/i18n/navigation'

export function JobUnavailable() {
  return (
    <main className="container-jid flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-arabic text-xl font-semibold text-jid-ink">هذه الفرصة لم تعد متاحة</h1>
      <p className="mt-3 max-w-md font-arabic text-sm text-jid-ink/70">
        قد تكون الفرصة مغلقة أو انتهى موعد التقديم عليها. تصفّح الفرص النشطة في لوحة الفرص.
      </p>
      <LocaleLink
        href="/opportunities"
        className="mt-6 inline-flex rounded-lg bg-jid-olive px-5 py-2.5 font-arabic text-sm font-medium text-jid-beige hover:bg-jid-olive-600"
      >
        العودة إلى لوحة الفرص
      </LocaleLink>
    </main>
  )
}
