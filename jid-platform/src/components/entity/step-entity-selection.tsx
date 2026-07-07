'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Combobox, useDebouncedValue } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  searchCompanies,
  createUnverifiedCompany,
  ensureUniversityCompany,
  searchUniversitiesCatalog,
  type CompanyRecord,
  type UniversityCatalogRecord,
} from '@/lib/entity/companies'
import { formatDomainsList } from '@/lib/entity/domains'
import type { EntitySignupType } from '@/lib/entity/constants'
import { createClient } from '@/lib/supabase/client'
import { newCompanySchema, type NewCompanyFormValues } from '@/lib/validations/entity'

export type EntitySelectionResult = {
  companyId: string
  companyName: string
  companyDomains: string[]
}

type StepEntitySelectionProps = {
  entityType: EntitySignupType
  initialCompanyId?: string | null
  onBack: () => void
  onContinue: (result: EntitySelectionResult) => void
}

export function StepEntitySelection({
  entityType,
  initialCompanyId,
  onBack,
  onContinue,
}: StepEntitySelectionProps) {
  const t = useTranslations('entity.wizard.entity')
  const tValidation = useTranslations('entity.validation')
  const [tab, setTab] = useState<'existing' | 'new'>('existing')
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<CompanyRecord[]>([])
  const [universities, setUniversities] = useState<UniversityCatalogRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(initialCompanyId ?? null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  const newForm = useForm<NewCompanyFormValues>({
    resolver: zodResolver(newCompanySchema),
    defaultValues: { name: '', name_ar: '', domains: '' },
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const supabase = createClient()
        if (entityType === 'university') {
          const results = await searchUniversitiesCatalog(supabase, debouncedSearch)
          if (!cancelled) setUniversities(results)
        } else {
          const results = await searchCompanies(supabase, debouncedSearch, entityType)
          if (!cancelled) setCompanies(results)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, entityType])

  const options = useMemo(
    () =>
      entityType === 'university'
        ? universities.map((u) => ({
            value: u.id,
            label: `${u.name_ar} - ${u.name_en}`,
            description: u.short_code,
          }))
        : companies.map((company) => ({
            value: company.id,
            label: company.name_ar ?? company.name,
            description: formatDomainsList(company.domains),
          })),
    [companies, entityType, universities],
  )

  const selectedCompany = companies.find((company) => company.id === selectedId) ?? null

  function translateError(message?: string) {
    if (!message?.startsWith('entity.validation.')) return message
    return tValidation(message.replace('entity.validation.', '') as 'emailInvalid')
  }

  async function handleExistingContinue() {
    if (entityType === 'university') {
      const selectedUniversity = universities.find((u) => u.id === selectedId)
      if (!selectedUniversity) return
      const supabase = createClient()
      const linked = await ensureUniversityCompany(supabase, selectedUniversity)
      onContinue({
        companyId: linked.id,
        companyName: linked.name_ar ?? linked.name,
        companyDomains: linked.domains,
      })
      return
    }

    if (!selectedCompany) return
    onContinue({
      companyId: selectedCompany.id,
      companyName: selectedCompany.name_ar ?? selectedCompany.name,
      companyDomains: selectedCompany.domains,
    })
  }

  async function handleNewSubmit(values: NewCompanyFormValues) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const created = await createUnverifiedCompany(supabase, {
        name: values.name,
        name_ar: values.name_ar,
        domainsInput: values.domains,
        entityType,
      })
      onContinue({
        companyId: created.id,
        companyName: created.name_ar ?? created.name,
        companyDomains: created.domains,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const canCreateNew = entityType !== 'university'

  return (
    <div className="space-y-4">
      <Tabs value={canCreateNew ? tab : 'existing'} onValueChange={(value) => setTab(value as 'existing' | 'new')}>
        <TabsList>
          <TabsTrigger value="existing">
            {entityType === 'university' ? 'اختر الجامعة' : t('tabs.existing')}
          </TabsTrigger>
          {canCreateNew ? <TabsTrigger value="new">{t('tabs.new')}</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          <FormField id="company_search" label={t('searchLabel')}>
            <Combobox
              options={options}
              value={selectedId}
              onValueChange={setSelectedId}
              placeholder={t('searchPlaceholder')}
              searchPlaceholder={t('searchInputPlaceholder')}
              emptyText={loading ? t('loading') : t('searchEmpty')}
              onSearchChange={setSearch}
            />
          </FormField>

          {selectedCompany && entityType !== 'university' ? (
            <div className="rounded-md bg-jid-beige p-3 text-sm text-jid-ink/80">
              <p className="font-medium text-jid-ink">{selectedCompany.name_ar ?? selectedCompany.name}</p>
              <p className="mt-1">
                {t('approvedDomains')}: {formatDomainsList(selectedCompany.domains)}
              </p>
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              {t('back')}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-jid-olive hover:bg-jid-olive/90"
              disabled={!selectedCompany}
              onClick={handleExistingContinue}
            >
              {t('continue')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="new">
          <form onSubmit={newForm.handleSubmit(handleNewSubmit)} className="space-y-4" noValidate>
            <FormField
              id="name"
              label={t('newName')}
              error={translateError(newForm.formState.errors.name?.message)}
            >
              <Input id="name" disabled={submitting} {...newForm.register('name')} />
            </FormField>

            <FormField
              id="name_ar"
              label={t('newNameAr')}
              error={translateError(newForm.formState.errors.name_ar?.message)}
            >
              <Input id="name_ar" disabled={submitting} {...newForm.register('name_ar')} />
            </FormField>

            <FormField
              id="domains"
              label={t('newDomains')}
              hint={t('newDomainsHint')}
              error={translateError(newForm.formState.errors.domains?.message)}
            >
              <Input
                id="domains"
                dir="ltr"
                className="text-start font-mono text-sm"
                placeholder="example.com, example.sa"
                disabled={submitting}
                {...newForm.register('domains')}
              />
            </FormField>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
                {t('back')}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-jid-olive hover:bg-jid-olive/90"
                disabled={submitting}
              >
                {submitting ? t('submitting') : t('continue')}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
