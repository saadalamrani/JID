import { getTranslations } from 'next-intl/server'
import { AuthShell } from '@/components/auth/auth-shell'
import { EntityTypeCard } from '@/components/entity/entity-type-card'
import { Link } from '@/lib/i18n/navigation'

export default async function EntityTypePage() {
  const t = await getTranslations('entity.entityType')

  return (
    <AuthShell
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <p>
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {t('loginLink')}
          </Link>
        </p>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <EntityTypeCard
          href="/signup/company"
          type="company"
          title={t('company.title')}
          description={t('company.description')}
        />
        <EntityTypeCard
          href="/signup/university"
          type="university"
          title={t('university.title')}
          description={t('university.description')}
        />
      </div>
    </AuthShell>
  )
}
