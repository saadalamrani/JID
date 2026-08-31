import { createClient } from '@/lib/supabase/server'
import { AssessmentList } from './assessment-list'

export default async function AssessmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('assessment_assignments').select('id,state,invited_at,expires_at,consented_at,started_at,completed_at,withdrawn_at,failure_code,disclosure_snapshot').order('invited_at',{ascending:false})
  return <main className="container-jid py-8"><AssessmentList locale={locale} initialAssignments={data ?? []} /></main>
}
