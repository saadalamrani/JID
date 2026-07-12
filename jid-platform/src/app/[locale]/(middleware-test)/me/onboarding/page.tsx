'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AcademicInfoStep } from '@/app/[locale]/(auth)/onboarding/_components/academic-info-step'
import { Button } from '@/components/ui/button'
import { updateAcademicOnboarding } from '@/lib/onboarding/mutations'
import { useRouter } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { onboardingAcademicSchema, onboardingSchema, type OnboardingAcademicValues } from '@/lib/validations/onboarding'

const onboardingFormSchema = z.object({
  academic: onboardingAcademicSchema,
})

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export default function MeOnboardingPage() {
  const router = useRouter()
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      academic: {
        university_id: '' as unknown as OnboardingAcademicValues['university_id'],
        college_id: '' as unknown as OnboardingAcademicValues['college_id'],
        major_id: '' as unknown as OnboardingAcademicValues['major_id'],
        graduation_year: new Date().getFullYear(),
        student_status: 'current_student',
      },
    },
  })

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await asUntyped(supabase)
        .from('profiles')
        .select('university_id, college_id, major_id, graduation_year, student_status')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        toast.error(error.message)
      } else if (data) {
        form.reset({
          academic: {
            university_id: ((data as { university_id: string | null }).university_id ?? '') as never,
            college_id: ((data as { college_id: string | null }).college_id ?? '') as never,
            major_id: ((data as { major_id: string | null }).major_id ?? '') as never,
            graduation_year:
              (data as { graduation_year: number | null }).graduation_year ?? new Date().getFullYear(),
            student_status:
              ((data as { student_status: OnboardingAcademicValues['student_status'] | null })
                .student_status ??
                'current_student'),
          },
        })
      }

      setLoadingProfile(false)
    }

    void run()
  }, [form, router])

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      onboardingSchema.parse({
        role: 'individual',
        path: '/me/onboarding',
        academic: values.academic,
      })
      await updateAcademicOnboarding(values.academic)
      toast.success('تم حفظ البيانات الأكاديمية')
      router.push('/me')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر حفظ البيانات')
    } finally {
      setSaving(false)
    }
  })

  return (
    <div className="container-jid py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-semibold text-foreground">إكمال ملفك الأكاديمي</h1>
        <FormProvider {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <AcademicInfoStep />
            <Button type="submit" disabled={loadingProfile || saving} className="w-full">
              {saving ? 'جاري الحفظ...' : 'حفظ ومتابعة'}
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
