/**
 * Spec 03 / 08-D — shared approved-without-profile notice for create-profile pages.
 */
import { getTranslations } from 'next-intl/server'

type ApprovedWithoutProfileNoticeProps = {
  actor: 'business' | 'university'
}

export async function ApprovedWithoutProfileNotice({
  actor,
}: ApprovedWithoutProfileNoticeProps) {
  const t = await getTranslations(`entity.approvedWithoutProfile.${actor}`)

  return (
    <div
      data-testid="approved-without-profile-notice"
      className="mb-6 rounded-lg border border-border border-s-4 border-s-jid-gold bg-jid-beige/50 p-5 text-sm"
    >
      <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
      <p className="mt-2 text-muted-foreground">{t('message')}</p>
      <p className="mt-3 font-medium text-foreground">{t('cta')}</p>
    </div>
  )
}
