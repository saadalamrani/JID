import { Lock, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

/** Section 5.5 — PDPL trust bar (server-rendered). */
export async function PdplTrustBar() {
  const t = await getTranslations('landing.pdpl')

  return (
    <section className="border-b border-border bg-primary py-8 text-primary-foreground">
      <div className="container-jid">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card/10">
              <ShieldCheck className="h-6 w-6 text-accent" aria-hidden />
            </span>
            <div>
              <h2 className="font-arabic text-lg font-semibold">{t('title')}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-primary-foreground/85">{t('body')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-card/10 px-3 py-1.5 text-xs font-medium">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              {t('badge')}
            </span>
            <Link
              href="/pdpl"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10"
            >
              {t('cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
