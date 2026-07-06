'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CvLanguageEntry, CvLanguageProficiency } from '@/types/cv'
import { CV_LANGUAGE_PROFICIENCY_LEVELS } from '@/types/cv'

const selectClassName =
  'flex h-10 w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm text-jid-ink'

type LanguageEditorProps = {
  languages: CvLanguageEntry[]
  onChange: (languages: CvLanguageEntry[]) => void
  error?: string
  maxLanguages?: number
}

const DEFAULT_PROFICIENCY: CvLanguageProficiency = 'conversational'

/** Section 7.9 — language name + proficiency dropdown, stored as JSONB array. */
export function LanguageEditor({
  languages,
  onChange,
  error,
  maxLanguages = 20,
}: LanguageEditorProps) {
  const t = useTranslations('cv.builder.skills')

  const rows = languages.length > 0 ? languages : [{ name: '', proficiency: DEFAULT_PROFICIENCY }]

  function updateRow(index: number, patch: Partial<CvLanguageEntry>) {
    const next = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    onChange(next)
  }

  function removeRow(index: number) {
    const next = rows.filter((_, rowIndex) => rowIndex !== index)
    onChange(next.length > 0 ? next : [{ name: '', proficiency: DEFAULT_PROFICIENCY }])
  }

  function addRow() {
    if (rows.length >= maxLanguages) return
    onChange([...rows, { name: '', proficiency: DEFAULT_PROFICIENCY }])
  }

  return (
    <fieldset className="space-y-3 rounded-md border border-jid-line/70 p-3">
      <legend className="px-1 text-xs font-medium text-jid-ink/70">{t('languagesTitle')}</legend>
      <p className="text-xs text-jid-ink/55">{t('languagesHint')}</p>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={`language-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor={`language-name-${index}`} className="text-jid-ink">
                {t('languageName')}
              </Label>
              <Input
                id={`language-name-${index}`}
                value={row.name}
                onChange={(event) => updateRow(index, { name: event.target.value })}
                placeholder={t('languageNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`language-proficiency-${index}`} className="text-jid-ink">
                {t('languageProficiency')}
              </Label>
              <select
                id={`language-proficiency-${index}`}
                className={selectClassName}
                value={row.proficiency}
                onChange={(event) =>
                  updateRow(index, { proficiency: event.target.value as CvLanguageProficiency })
                }
              >
                {CV_LANGUAGE_PROFICIENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`proficiency.${level}`)}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-jid-ink/50 hover:text-destructive"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1 && !row.name.trim()}
              aria-label={t('removeLanguage', { index: index + 1 })}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={rows.length >= maxLanguages}
        className="gap-1"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t('addLanguage')}
      </Button>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
