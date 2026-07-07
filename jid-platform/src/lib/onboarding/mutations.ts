import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import type { OnboardingAcademicValues } from '@/lib/validations/onboarding'

async function requireUserId(supabase: SupabaseClient<Database>): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

export async function updateAcademicOnboarding(values: OnboardingAcademicValues): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId(supabase)

  const { error } = await supabase
    .from('profiles')
    .update({
      university_id: values.university_id,
      college_id: values.college_id,
      major_id: values.major_id,
      graduation_year: values.graduation_year,
      student_status: values.student_status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}
