'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ActionButtonStrip } from '@/components/profile/action-button-strip'
import { CompanyIdentityHeader } from '@/components/profile/company-identity-header'
import { IdentityHeader } from '@/components/profile/identity-header'
import { MentorIdentityHeader } from '@/components/profile/mentor-identity-header'
import { ProfileCompletionBar } from '@/components/profile/profile-completion-bar'
import { SmartLinksRow } from '@/components/profile/smart-link'
import { TrustSignals } from '@/components/profile/trust-signals'
import type { EarnedUserBadge } from '@/lib/profile/types'

const MOCK_BADGES: EarnedUserBadge[] = [
  {
    id: '1',
    slug: 'verified',
    category: 'individual',
    name_ar: 'موثّق',
    name_en: 'Verified',
    description_ar: 'تحقق من الهوية',
    description_en: 'Identity verified',
    icon_key: 'badge-verified',
    awarded_at: new Date().toISOString(),
    metadata: {},
  },
  {
    id: '2',
    slug: 'cv_builder',
    category: 'individual',
    name_ar: 'باني السيرة',
    name_en: 'CV Builder',
    description_ar: null,
    description_en: null,
    icon_key: 'badge-cv',
    awarded_at: new Date().toISOString(),
    metadata: {},
  },
]

export default function ProfileComponentsPreviewPage() {
  const t = useTranslations('profile.components')

  return (
    <main className="container-jid space-y-10 py-10">
      <h1 className="text-2xl font-semibold text-foreground">{t('previewTitle')}</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/60">Individual — owner</h2>
        <IdentityHeader
          isOwner
          isVerified
          fullName="سارة العتيبي"
          headline="مهندسة برمجيات | باحثة عن فرص تقنية"
          city="الرياض"
          universityName="جامعة الملك سعود"
          studentStatus="graduate"
          editHref="/me/edit"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/60">Individual — visitor (no edit)</h2>
        <IdentityHeader
          isOwner={false}
          isVerified
          fullName="سارة العتيبي"
          headline="مهندسة برمجيات"
          city="الرياض"
          universityName="جامعة الملك سعود"
          studentStatus="graduate"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/60">Company</h2>
        <CompanyIdentityHeader
          isOwner
          name="SABIC"
          nameAr="سابك"
          tagline="كيمياء تصنع المستقبل"
          isVerified
          foundedYear={1976}
          employeeCountRange="10,000+"
          entityState="claimed"
          editHref="/company/edit"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/60">Mentor</h2>
        <MentorIdentityHeader
          isOwner
          fullName="أحمد الراشد"
          headline="مدير منتجات سابق — أرامكو"
          bioSnippet="أرشد الخريجين في التحول من الجامعة إلى أول وظيفة في القطاع التقني."
          isVerified
          avgResponseHours={4.5}
          status="approved"
          editHref="/mentor/edit"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/60">Trust signals — owner stats</h2>
        <TrustSignals
          badges={MOCK_BADGES}
          showStats
          profileId="a0000000-0000-4000-8000-000000000002"
          completionPct={85}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/60">Trust signals — visitor (no stats)</h2>
        <TrustSignals badges={MOCK_BADGES} showStats={false} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/60">Completion bar</h2>
        <ProfileCompletionBar percent={85} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/60">Smart links</h2>
        <SmartLinksRow
          smartLinks={{
            linkedin: 'linkedin.com/in/sara',
            github: 'github.com/sara',
            portfolio: 'sara.dev',
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/60">Action strip</h2>
        <ActionButtonStrip ariaLabel="Profile actions">
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            Primary action
          </Button>
          <Button size="sm" variant="outline">
            Secondary
          </Button>
        </ActionButtonStrip>
      </section>
    </main>
  )
}
