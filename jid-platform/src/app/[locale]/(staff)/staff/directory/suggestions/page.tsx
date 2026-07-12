import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { SuggestionsReviewList } from './_components/suggestions-review-list'
import { fetchPendingCorrectionSuggestions } from '@/lib/staff/directory-queries'

/** P-108 — correction-suggestion review queue. */
export default async function DirectorySuggestionsPage() {
  const t = await getTranslations('staff.directory.suggestions')
  const items = await fetchPendingCorrectionSuggestions(100)

  return (
    <div className="space-y-6">
      <header>
        <Link href="/staff/directory" className="text-sm text-primary hover:underline">
          {t('back')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <SuggestionsReviewList items={items} />
    </div>
  )
}
