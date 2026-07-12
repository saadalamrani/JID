import { getLocale } from 'next-intl/server'
import type {
  IndividualProfileProjection,
  IndividualProfileSectionId,
} from '@/lib/profile/individual-projection-types'
import { IndividualIdentityCard } from '@/components/profile/workspace/individual-identity-card'
import { IndividualPrimaryActions } from '@/components/profile/workspace/individual-primary-actions'
import { IndividualSectionNav } from '@/components/profile/workspace/individual-section-nav'
import { OwnerUtilityRail } from '@/components/profile/workspace/owner-utility-rail'
import { OwnerStatsRow } from '@/components/profile/workspace/owner-stats-row'
import { ProfileOverviewSection } from '@/components/profile/workspace/profile-overview-section'
import { CareerCanvasSummaryCard } from '@/components/profile/workspace/career-canvas-summary-card'
import { CareerTimelineSection } from '@/components/profile/workspace/career-timeline-section'
import { FeaturedProjectsSection } from '@/components/profile/workspace/featured-projects-section'
import { ProfileExperienceSection } from '@/components/profile/workspace/profile-experience-section'
import { ProfileEducationSection } from '@/components/profile/workspace/profile-education-section'
import { ProfileSkillsSection } from '@/components/profile/workspace/profile-skills-section'
import { ProfileCertificationsSection } from '@/components/profile/workspace/profile-certifications-section'
import { ProfileAchievementsSection } from '@/components/profile/workspace/profile-achievements-section'
import { ProfileMentorshipSection } from '@/components/profile/workspace/profile-mentorship-section'
import { PortfolioPreviewCard } from '@/components/profile/workspace/portfolio-preview-card'
import { CvBuilderEntryCard } from '@/components/profile/workspace/cv-builder-entry-card'
import { PublicPreviewBanner } from '@/components/profile/workspace/public-preview-banner'

type IndividualProfileWorkspaceProps = {
  projection: IndividualProfileProjection
  isPublicPreview?: boolean
}

function hiddenSectionsForNav(
  projection: IndividualProfileProjection,
  isOwner: boolean,
): IndividualProfileSectionId[] {
  const hidden: IndividualProfileSectionId[] = []
  const { sections } = projection

  if (!sections.showOverview || (!isOwner && !projection.overview?.trim())) {
    hidden.push('overview')
  }
  if (!sections.showCanvas) hidden.push('canvas')
  if (!sections.showTimeline || projection.timeline.length === 0) hidden.push('timeline')
  if (!sections.showProjects || (!isOwner && projection.projects.length === 0)) {
    hidden.push('projects')
  }
  if (!sections.showExperience || (!isOwner && projection.experience.length === 0)) {
    hidden.push('experience')
  }
  if (!sections.showSkills || (!isOwner && projection.skills.length === 0)) {
    hidden.push('skills')
  }
  if (!sections.showEducation || (!isOwner && projection.education.length === 0)) {
    hidden.push('education')
  }
  if (!sections.showCertifications || (!isOwner && projection.certifications.length === 0)) {
    hidden.push('certifications')
  }
  if (!sections.showMentorship) hidden.push('mentorship')
  if (!sections.showAchievements || (!isOwner && projection.badges.length === 0)) {
    hidden.push('achievements')
  }
  if (!sections.showPortfolio) hidden.push('portfolio')
  if (!sections.showCvBuilder) hidden.push('cv')

  return hidden
}

export async function IndividualProfileWorkspace({
  projection,
  isPublicPreview = false,
}: IndividualProfileWorkspaceProps) {
  const locale = (await getLocale()) as 'ar' | 'en'
  const isOwner = projection.viewState === 'owner'
  const hiddenNav = hiddenSectionsForNav(projection, isOwner)

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {isPublicPreview ? <PublicPreviewBanner profileId={projection.profileId} /> : null}

      <div
        className="container-jid flex flex-col gap-6 py-8 lg:grid lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(220px,260px)]"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Mobile order 1 / Desktop identity column */}
        <div className="order-1 space-y-4 lg:col-start-1 lg:row-start-1">
          <IndividualIdentityCard projection={projection} locale={locale} />
          <div className="hidden lg:block">
            <IndividualPrimaryActions projection={projection} />
            <div className="mt-4">
              <IndividualSectionNav hiddenSections={hiddenNav} />
            </div>
          </div>
        </div>

        {/* Mobile order 2 — primary actions */}
        <div className="order-2 lg:hidden">
          <IndividualPrimaryActions projection={projection} />
        </div>

        {/* Mobile order 3 — section nav */}
        <div className="order-3 lg:hidden">
          <IndividualSectionNav hiddenSections={hiddenNav} />
        </div>

        {/* Mobile order 4+ — main content */}
        <main className="order-4 min-w-0 space-y-10 lg:order-2 lg:col-start-2 lg:row-start-1">
          {isOwner && projection.sections.showOwnerStats && projection.ownerStats ? (
            <OwnerStatsRow stats={projection.ownerStats} locale={locale} />
          ) : null}

          <ProfileOverviewSection projection={projection} />

          {projection.sections.showCanvas ? (
            <CareerCanvasSummaryCard canvas={projection.canvas} />
          ) : null}

          {projection.sections.showTimeline ? (
            <CareerTimelineSection
              entries={projection.timeline}
              kinds={projection.timelineKinds}
              isOwner={isOwner}
              evidenceVaultAvailable={projection.evidenceVaultAvailable}
            />
          ) : null}

          <FeaturedProjectsSection
            projects={projection.projects}
            evidenceVaultAvailable={projection.evidenceVaultAvailable}
            isOwner={isOwner}
            visible={projection.sections.showProjects}
          />

          <ProfileExperienceSection
            experience={projection.experience}
            isOwner={isOwner}
            visible={projection.sections.showExperience}
            evidenceVaultAvailable={projection.evidenceVaultAvailable}
          />

          <ProfileSkillsSection
            skills={projection.skills}
            isOwner={isOwner}
            visible={projection.sections.showSkills}
          />

          <ProfileEducationSection
            education={projection.education}
            isOwner={isOwner}
            visible={projection.sections.showEducation}
          />

          <ProfileCertificationsSection
            certifications={projection.certifications}
            isOwner={isOwner}
            visible={projection.sections.showCertifications}
            evidenceVaultAvailable={projection.evidenceVaultAvailable}
          />

          <PortfolioPreviewCard
            portfolio={projection.portfolio}
            isOwner={isOwner}
          />

          <CvBuilderEntryCard visible={projection.sections.showCvBuilder} />

          <ProfileMentorshipSection
            mentorship={projection.mentorship}
            visible={projection.sections.showMentorship}
          />

          <ProfileAchievementsSection
            badges={projection.badges}
            locale={locale}
            visible={projection.sections.showAchievements}
            isOwner={isOwner}
          />
        </main>

        {isOwner && projection.completionPct != null ? (
          <aside className="order-5 space-y-4 lg:order-3 lg:col-start-3 lg:row-start-1">
            <OwnerUtilityRail
              completionPct={projection.completionPct}
              missing={projection.completionMissing ?? []}
              graduateBadgeVisible={projection.graduateBadgeVisibleInDirectory ?? false}
              privacySettings={projection.privacySettings}
              publicPreviewHref={
                projection.publicPreviewHref ?? `/profile/${projection.profileId}?view=public`
              }
              hasGraduateBadge={projection.badges.some((b) => b.slug === 'mentorship_graduate')}
            />
          </aside>
        ) : null}
      </div>
    </div>
  )
}
