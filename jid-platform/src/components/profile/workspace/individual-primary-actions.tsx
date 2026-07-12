'use client'

import {
  Download,
  ExternalLink,
  Pencil,
  Share2,
  Wallet,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { MaskedContactButton } from '@/components/profile/masked-contact-button'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'
import type { IndividualProfileProjection } from '@/lib/profile/individual-projection-types'

type IndividualPrimaryActionsProps = {
  projection: IndividualProfileProjection
  className?: string
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function IndividualPrimaryActions({ projection, className }: IndividualPrimaryActionsProps) {
  const t = useTranslations('profile.workspace')
  const { identity, viewState, portfolioUrl } = projection
  const isOwner = viewState === 'owner'
  const displayName = identity.fullName ?? '—'

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: displayName, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success(t('shareCopied'))
    } catch {
      toast.error(t('shareFailed'))
    }
  }

  return (
    <div
      className={className}
      role="toolbar"
      aria-label={t('actionsAria')}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-col">
        {isOwner ? (
          <>
            <Button asChild size="sm" variant="outline" className="w-full justify-start gap-2">
              <Link href="/profile/edit">
                <Pencil className="h-4 w-4" aria-hidden />
                {t('actions.editProfile')}
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => void handleShare()}
            >
              <Share2 className="h-4 w-4" aria-hidden />
              {t('actions.share')}
            </Button>
            {projection.sections.showCvBuilder ? (
              <Button asChild size="sm" variant="outline" className="w-full justify-start gap-2">
                <Link href="/profile/cv">
                  <Download className="h-4 w-4" aria-hidden />
                  {t('actions.downloadCv')}
                </Link>
              </Button>
            ) : null}
            {portfolioUrl ? (
              <Button asChild size="sm" variant="outline" className="w-full justify-start gap-2">
                <a href={normalizeUrl(portfolioUrl)} target="_blank" rel="noopener noreferrer">
                  <Wallet className="h-4 w-4" aria-hidden />
                  {t('actions.portfolio')}
                </a>
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => void handleShare()}
            >
              <Share2 className="h-4 w-4" aria-hidden />
              {t('actions.share')}
            </Button>
            {projection.showSaveAction ? (
              <Button type="button" size="sm" variant="outline" className="w-full justify-start gap-2">
                {t('actions.save')}
              </Button>
            ) : null}
            {projection.allowContact ? (
              <div className="w-full [&_button]:w-full [&_button]:justify-start">
                <MaskedContactButton />
              </div>
            ) : null}
            {portfolioUrl && projection.sections.showPortfolio ? (
              <Button asChild size="sm" variant="outline" className="w-full justify-start gap-2">
                <a href={normalizeUrl(portfolioUrl)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  {t('actions.viewPortfolio')}
                </a>
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
