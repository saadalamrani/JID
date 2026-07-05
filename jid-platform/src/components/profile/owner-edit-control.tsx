'use client'

import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'

type OwnerEditControlProps = {
  isOwner: boolean
  editHref?: string
  onEdit?: () => void
}

/** Renders nothing unless `isOwner` is true — edit affordance is owner-only. */
export function OwnerEditControl({ isOwner, editHref, onEdit }: OwnerEditControlProps) {
  const t = useTranslations('profile.components')

  if (!isOwner) return null

  if (editHref) {
    return (
      <Button asChild variant="outline" size="sm" className="border-jid-line text-jid-ink">
        <Link href={editHref}>
          <Pencil className="h-4 w-4" aria-hidden />
          {t('editProfile')}
        </Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-jid-line text-jid-ink"
      onClick={onEdit}
    >
      <Pencil className="h-4 w-4" aria-hidden />
      {t('editProfile')}
    </Button>
  )
}
