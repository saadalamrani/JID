'use client'

import { type FormEvent } from 'react'
import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { AnnouncementList } from '@/app/[locale]/(staff)/staff/announcements/_components/announcement-list'
import type { AnnouncementRow } from '@/lib/announcements/queries'
import { ANNOUNCEMENT_CATEGORIES } from '@/lib/validations/announcement'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from '@/lib/i18n/navigation'

type AnnouncementsListClientProps = {
  announcements: AnnouncementRow[]
  initialCategory: string
  initialStatus: string
  initialSearch: string
}

export function AnnouncementsListClient({
  announcements,
  initialCategory,
  initialStatus,
  initialSearch,
}: AnnouncementsListClientProps) {
  const t = useTranslations('staff.announcements')
  const router = useRouter()

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const params = new URLSearchParams()
    const category = String(formData.get('category') ?? 'all')
    const status = String(formData.get('status') ?? 'all')
    const search = String(formData.get('search') ?? '').trim()

    if (category !== 'all') params.set('category', category)
    if (status !== 'all') params.set('status', status)
    if (search) params.set('search', search)

    const query = params.toString()
    router.push(query ? `/staff/announcements?${query}` : '/staff/announcements')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button asChild>
          <Link href="/staff/announcements/new">{t('create')}</Link>
        </Button>
      </div>

      <form
        className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4"
        onSubmit={applyFilters}
      >
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">{t('filters.category')}</span>
          <select
            name="category"
            defaultValue={initialCategory}
            className="w-full rounded-md border border-border px-3 py-2"
          >
            <option value="all">{t('filters.allCategories')}</option>
            {ANNOUNCEMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t(`list.categories.${category}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">{t('filters.status')}</span>
          <select
            name="status"
            defaultValue={initialStatus}
            className="w-full rounded-md border border-border px-3 py-2"
          >
            <option value="all">{t('filters.allStatuses')}</option>
            <option value="published">{t('list.status.published')}</option>
            <option value="draft">{t('list.status.draft')}</option>
            <option value="scheduled">{t('list.status.scheduled')}</option>
            <option value="expired">{t('list.status.expired')}</option>
          </select>
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-muted-foreground">{t('filters.search')}</span>
          <Input name="search" defaultValue={initialSearch} placeholder={t('filters.searchPlaceholder')} />
        </label>

        <div className="md:col-span-4">
          <Button type="submit" variant="outline" size="sm">
            {t('filters.apply')}
          </Button>
        </div>
      </form>

      <AnnouncementList announcements={announcements} />
    </div>
  )
}
