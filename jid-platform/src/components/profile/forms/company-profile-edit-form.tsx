'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateCompanyProfile } from '@/lib/profile/mutations'
import type { CompanyProfileRecord } from '@/lib/profile/types'
import {
  companyProfileEditSchema,
  type CompanyProfileEditValues,
} from '@/lib/validations/profile'

type CompanyProfileEditFormProps = {
  company: CompanyProfileRecord
}

function toOfficeLocations(raw: unknown): CompanyProfileEditValues['office_locations'] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const city = typeof row.city === 'string' ? row.city : ''
      if (!city.trim()) return null
      return {
        city: city.trim(),
        region: typeof row.region === 'string' ? row.region : undefined,
        address: typeof row.address === 'string' ? row.address : undefined,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export function CompanyProfileEditForm({ company }: CompanyProfileEditFormProps) {
  const t = useTranslations('profile.edit')
  const router = useRouter()

  const form = useForm<CompanyProfileEditValues>({
    resolver: zodResolver(companyProfileEditSchema),
    defaultValues: {
      tagline_ar: company.tagline_ar ?? '',
      tagline_en: company.tagline_en ?? '',
      about_long_ar: company.about_long_ar ?? '',
      about_long_en: company.about_long_en ?? '',
      founded_year: company.founded_year,
      employee_count_range: company.employee_count_range ?? '',
      office_locations: toOfficeLocations(company.office_locations),
    },
  })

  const offices = useFieldArray({ control: form.control, name: 'office_locations' })

  async function onSubmit(values: CompanyProfileEditValues) {
    try {
      await updateCompanyProfile(company.id, values)
      toast.success(t('saved'))
      router.push('/company/profile')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveFailed'))
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="container-jid space-y-6 py-8">
      <h1 className="text-xl font-semibold text-foreground">{t('companyTitle')}</h1>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">{t('sectionTaglines')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="tagline_ar" label={t('taglineAr')}>
            <Input id="tagline_ar" {...form.register('tagline_ar')} />
          </FormField>
          <FormField id="tagline_en" label={t('taglineEn')}>
            <Input id="tagline_en" {...form.register('tagline_en')} dir="ltr" />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">{t('sectionAbout')}</h2>
        <div className="grid gap-4">
          <FormField id="about_long_ar" label={t('aboutAr')}>
            <textarea
              id="about_long_ar"
              rows={5}
              className="flex w-full rounded-md border border-border px-3 py-2 text-sm"
              {...form.register('about_long_ar')}
            />
          </FormField>
          <FormField id="about_long_en" label={t('aboutEn')}>
            <textarea
              id="about_long_en"
              rows={5}
              className="flex w-full rounded-md border border-border px-3 py-2 text-sm"
              dir="ltr"
              {...form.register('about_long_en')}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">{t('sectionCompanyMeta')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="founded_year" label={t('foundedYear')}>
            <Input id="founded_year" type="number" {...form.register('founded_year')} />
          </FormField>
          <FormField id="employee_count_range" label={t('employeeCount')}>
            <Input id="employee_count_range" {...form.register('employee_count_range')} />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">{t('sectionOffices')}</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => offices.append({ city: '', region: '', address: '' })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('addOffice')}
          </Button>
        </div>
        <div className="space-y-4">
          {offices.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-3">
              <Input placeholder={t('officeCity')} {...form.register(`office_locations.${index}.city`)} />
              <Input placeholder={t('officeRegion')} {...form.register(`office_locations.${index}.region`)} />
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder={t('officeAddress')}
                  {...form.register(`office_locations.${index}.address`)}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => offices.remove(index)}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/company/profile')}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
