'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import type { SysEntityDetail } from '@/types/sys-entities'
import {
  forceApproveEntity,
  forceRejectEntity,
  updateEntityMetadata,
} from '@/app/[locale]/(sys)/sys/entities/actions'
import { ConfirmDialog } from '@/app/[locale]/(sys)/sys/flags/_components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PendingAction = 'approve' | 'reject' | 'metadata'

type EntityActionsMenuProps = {
  entity: SysEntityDetail
}

export function EntityActionsMenu({ entity }: EntityActionsMenuProps) {
  const t = useTranslations('sys.entities.detail.actions')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState({
    name: entity.name,
    name_ar: entity.name_ar ?? '',
    website_url: entity.website_url ?? '',
    tagline_en: entity.tagline_en ?? '',
    tagline_ar: entity.tagline_ar ?? '',
  })

  const openAction = (action: PendingAction) => {
    setError(null)
    setPendingAction(action)
    setConfirmOpen(true)
  }

  const handleConfirm = async (reason: string) => {
    let result: Awaited<ReturnType<typeof forceApproveEntity>>

    switch (pendingAction) {
      case 'approve':
        result = await forceApproveEntity(entity.id, reason)
        break
      case 'reject':
        result = await forceRejectEntity(entity.id, reason)
        break
      case 'metadata':
        result = await updateEntityMetadata(
          entity.id,
          {
            name: metadata.name,
            name_ar: metadata.name_ar || null,
            website_url: metadata.website_url || null,
            tagline_en: metadata.tagline_en || null,
            tagline_ar: metadata.tagline_ar || null,
          },
          reason,
        )
        break
      default:
        return
    }

    if (!result.ok) {
      setError(result.error)
      throw new Error(result.error)
    }

    setError(null)
    startTransition(() => router.refresh())
  }

  const confirmTitle =
    pendingAction === 'approve'
      ? t('confirm.approveTitle')
      : pendingAction === 'reject'
        ? t('confirm.rejectTitle')
        : t('confirm.metadataTitle')

  const confirmDescription =
    pendingAction === 'approve'
      ? t('confirm.approveDescription')
      : pendingAction === 'reject'
        ? t('confirm.rejectDescription')
        : t('confirm.metadataDescription')

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('overrideTitle')}</h2>
        <p className="mt-1 text-sm text-jid-ink/55">{t('overrideSubtitle')}</p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending || entity.entity_state === 'approved'}
            onClick={() => openAction('approve')}
          >
            {t('forceApprove')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || entity.entity_state === 'unclaimed'}
            onClick={() => openAction('reject')}
          >
            {t('forceReject')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('metadataTitle')}</h2>
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="entity-name">{t('fields.name')}</Label>
            <Input
              id="entity-name"
              value={metadata.name}
              onChange={(e) => setMetadata((m) => ({ ...m, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="entity-name-ar">{t('fields.nameAr')}</Label>
            <Input
              id="entity-name-ar"
              value={metadata.name_ar}
              onChange={(e) => setMetadata((m) => ({ ...m, name_ar: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="entity-website">{t('fields.website')}</Label>
            <Input
              id="entity-website"
              dir="ltr"
              value={metadata.website_url}
              onChange={(e) => setMetadata((m) => ({ ...m, website_url: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="entity-tagline">{t('fields.tagline')}</Label>
            <Input
              id="entity-tagline"
              value={metadata.tagline_en}
              onChange={(e) => setMetadata((m) => ({ ...m, tagline_en: e.target.value }))}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => openAction('metadata')}
          >
            {t('saveMetadata')}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        destructive={pendingAction === 'reject'}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
