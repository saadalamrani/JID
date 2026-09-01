import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ApplicationsPanel } from '@/app/[locale]/(individual)/home/_components/applications-panel'
import { AttentionPanel } from '@/app/[locale]/(individual)/home/_components/attention-panel'
import { ChangesPanel } from '@/app/[locale]/(individual)/home/_components/changes-panel'
import { OpportunitiesPanel } from '@/app/[locale]/(individual)/home/_components/opportunities-panel'
import { RecordPanel } from '@/app/[locale]/(individual)/home/_components/record-panel'
import { StandingPanel } from '@/app/[locale]/(individual)/home/_components/standing-panel'
import { getCurrentViewer } from '@/lib/profile/queries'
import { getPortalHomeForRole } from '@/lib/auth/portal-routes'
import type { UserRole } from '@/lib/auth/rbac'
import { getIndividualHomeModel } from '@/lib/individual-home/get-individual-home-model'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('individualHome.meta')
  return { title: t('title'), description: t('description') }
}

/**
 * D1 R2 — Individual Home (docs/design-research/D1_REFERENCE_EXPERIENCES.md#r2).
 *
 * Material recomposition: today `/me` → `/profile` → the person's own **public
 * profile projection** stands in for a workspace that does not exist. This route
 * replaces that redirect chain with a real personal workspace anchored to the
 * Career Record, in the reading order R1-C specifies: standing → attention →
 * changed → the record at a glance → opportunities → applications. No widget
 * grid, no profile-completeness %, no readiness score, no feed, no fabricated
 * metric anywhere on this page.
 */
export default async function IndividualHomePage() {
  const viewer = await getCurrentViewer()

  if (!viewer.userId) {
    redirect('/login')
  }

  // Defense in depth: this route is for the Individual actor only. RLS already
  // scopes every query below to the signed-in user, so no other actor's data can
  // render here even without this check — but a non-individual role should still
  // land on their own portal home, not an Individual-shaped page with no data.
  if (viewer.role && viewer.role !== 'individual') {
    redirect(getPortalHomeForRole(viewer.role as UserRole))
  }

  const model = await getIndividualHomeModel()
  if (!model) {
    redirect('/login')
  }

  return (
    <main className="container-jid max-w-3xl py-8 md:py-12">
      <div className="space-y-10">
        <StandingPanel model={model} />
        <AttentionPanel model={model} />
        <ChangesPanel model={model} />
        <RecordPanel model={model} />
        <OpportunitiesPanel model={model} />
        <ApplicationsPanel model={model} />
      </div>
    </main>
  )
}
