'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { COMM_KIND_LABELS_AR } from '@/lib/constants/communication'
import { cancelCommunicationBatch } from '@/lib/communication/client'
import type { CommunicationBatch } from '@/types/communication'
import { cn } from '@/lib/utils'

type UndoBannerProps = {
  batches: CommunicationBatch[]
  onCanceled: () => void
  className?: string
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Sticky undo banner — strict 15-minute window (Prompt 4).
 */
export function UndoBanner({ batches, onCanceled, className }: UndoBannerProps) {
  const [now, setNow] = useState(Date.now())
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const activeBatches = useMemo(
    () =>
      batches.filter((batch) => {
        if (!batch.scheduledSendAt) return false
        return new Date(batch.scheduledSendAt).getTime() > now
      }),
    [batches, now],
  )

  if (activeBatches.length === 0) return null

  async function handleCancel(batchId: string) {
    setCancelingId(batchId)
    try {
      await cancelCommunicationBatch(batchId)
      if (process.env.NODE_ENV === 'development') {
        console.debug('[analytics]', 'cascade_batch_canceled_in_undo', { batch_id: batchId })
      }
      toast.success('تم إلغاء الإرسال')
      onCanceled()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذّر الإلغاء — ربما انتهت مهلة التراجع')
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {activeBatches.map((batch) => {
        const remainingMs = batch.scheduledSendAt
          ? new Date(batch.scheduledSendAt).getTime() - now
          : 0
        const kindLabel = COMM_KIND_LABELS_AR[batch.kind]

        return (
          <div
            key={batch.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-jid-gold/40 bg-jid-beige-warm/80 px-4 py-3"
            role="status"
          >
            <p className="font-arabic text-sm text-jid-olive">
              سيُرسل «{kindLabel}» إلى {batch.recipientCount} متقدماً خلال{' '}
              <span className="font-mono tabular-nums">{formatCountdown(remainingMs)}</span>
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="font-arabic"
              disabled={cancelingId === batch.id}
              onClick={() => void handleCancel(batch.id)}
            >
              تراجع
            </Button>
          </div>
        )
      })}
    </div>
  )
}
