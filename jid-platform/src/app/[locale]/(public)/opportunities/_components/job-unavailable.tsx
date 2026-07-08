import { Link as LocaleLink } from '@/lib/i18n/navigation'

export function JobUnavailable() {
  return (
    <main className="container-jid flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-arabic text-xl font-semibold text-foreground">هذه الفرصة لم تعد متاحة</h1>
      <p className="mt-3 max-w-md font-arabic text-sm text-muted-foreground">
        قد تكون الفرصة مغلقة أو انتهى موعد التقديم عليها. تصفّح الفرص النشطة في لوحة الفرص.
      </p>
      <LocaleLink
        href="/opportunities"
        className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 font-arabic text-sm font-medium text-jid-beige hover:bg-primary-600"
      >
        العودة إلى لوحة الفرص
      </LocaleLink>
    </main>
  )
}
