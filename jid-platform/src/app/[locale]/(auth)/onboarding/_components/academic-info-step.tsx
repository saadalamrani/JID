'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Combobox } from '@/components/ui/combobox'
import { track } from '@/lib/analytics/track'
import { useCollegesCatalog } from '@/lib/queries/colleges'
import { useMajorsCatalog } from '@/lib/queries/majors'
import { useUniversitiesCatalog } from '@/lib/queries/universities'
import type { OnboardingAcademicValues } from '@/lib/validations/onboarding'

const studentStatusOptions: Array<{ value: OnboardingAcademicValues['student_status']; label: string }> = [
  { value: 'current_student', label: 'طالب حالي' },
  { value: 'expected_graduate', label: 'متوقع التخرج' },
  { value: 'graduate', label: 'خريج' },
  { value: 'alumni', label: 'خريج سابق' },
  { value: 'other', label: 'أخرى' },
]

function graduationYears(): number[] {
  const current = new Date().getFullYear()
  return Array.from({ length: 70 }, (_, i) => current + 5 - i)
}

type AcademicStepValues = {
  academic: OnboardingAcademicValues
}

export function AcademicInfoStep() {
  const form = useFormContext<AcademicStepValues>()
  const universityId = form.watch('academic.university_id')
  const collegeId = form.watch('academic.college_id')

  const universitiesQuery = useUniversitiesCatalog()
  const collegesQuery = useCollegesCatalog(universityId || undefined)
  const majorsQuery = useMajorsCatalog(collegeId || undefined)

  useEffect(() => {
    form.setValue('academic.college_id', '' as never, { shouldDirty: true })
    form.setValue('academic.major_id', '' as never, { shouldDirty: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universityId])

  useEffect(() => {
    form.setValue('academic.major_id', '' as never, { shouldDirty: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId])

  const universities = (universitiesQuery.data ?? []).map((u) => ({
    value: u.id,
    label: `${u.name_ar} - ${u.name_en}`,
    description: u.short_code,
  }))

  const colleges = (collegesQuery.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.name_ar} - ${c.name_en}`,
  }))

  const majors = (majorsQuery.data ?? []).map((m) => ({
    value: m.id,
    label: `${m.name_ar} - ${m.name_en}`,
    description: m.cip_code ?? undefined,
  }))

  return (
    <section className="space-y-4 rounded-2xl border border-jid-line bg-white p-5">
      <h2 className="text-lg font-semibold text-jid-ink">البيانات الأكاديمية</h2>

      <label className="block space-y-2">
        <span className="text-sm text-jid-ink/80">الجامعة</span>
        <Combobox
          options={universities}
          value={form.watch('academic.university_id') || null}
          onValueChange={(value) => {
            form.setValue('academic.university_id', value, { shouldDirty: true })
            if (value) {
              track('student_university_selected', { university_id: value, source: 'onboarding_academic' })
            }
          }}
          placeholder={universitiesQuery.isLoading ? 'جاري التحميل...' : 'اختر الجامعة'}
          searchPlaceholder="ابحث باسم الجامعة"
          emptyText="لا توجد نتائج"
        />
        <p className="text-xs text-red-600">{form.formState.errors.academic?.university_id?.message}</p>
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-jid-ink/80">الكلية</span>
        <select
          className="h-10 w-full rounded-md border border-jid-line px-3 text-sm"
          disabled={!universityId}
          value={form.watch('academic.college_id') || ''}
          onChange={(e) => form.setValue('academic.college_id', e.target.value, { shouldDirty: true })}
        >
          <option value="">{universityId ? 'اختر الكلية' : 'اختر الجامعة أولاً'}</option>
          {colleges.map((college) => (
            <option key={college.value} value={college.value}>
              {college.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-red-600">{form.formState.errors.academic?.college_id?.message}</p>
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-jid-ink/80">التخصص</span>
        <Combobox
          options={majors}
          value={form.watch('academic.major_id') || null}
          onValueChange={(value) => form.setValue('academic.major_id', value, { shouldDirty: true })}
          placeholder={collegeId ? 'اختر التخصص' : 'اختر الكلية أولاً'}
          searchPlaceholder="ابحث باسم التخصص"
          emptyText="لا توجد نتائج"
          disabled={!collegeId}
        />
        <p className="text-xs text-red-600">{form.formState.errors.academic?.major_id?.message}</p>
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-jid-ink/80">سنة التخرج</span>
        <select
          className="h-10 w-full rounded-md border border-jid-line px-3 text-sm"
          value={String(form.watch('academic.graduation_year') ?? '')}
          onChange={(e) =>
            form.setValue('academic.graduation_year', Number(e.target.value), { shouldDirty: true })
          }
        >
          <option value="">اختر سنة التخرج</option>
          {graduationYears().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <p className="text-xs text-red-600">{form.formState.errors.academic?.graduation_year?.message}</p>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm text-jid-ink/80">الحالة الدراسية</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {studentStatusOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 rounded-md border border-jid-line px-3 py-2">
              <input
                type="radio"
                name="student_status"
                value={option.value}
                checked={form.watch('academic.student_status') === option.value}
                onChange={() =>
                  form.setValue('academic.student_status', option.value, { shouldDirty: true })
                }
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-red-600">{form.formState.errors.academic?.student_status?.message}</p>
      </fieldset>
    </section>
  )
}
