'use client'

import { CheckCircle2, ExternalLink } from 'lucide-react'
import { useSelfDeclaration } from '@/lib/hooks/use-self-declaration'
import { cn } from '@/lib/utils'
import { InterceptorModal } from './interceptor-modal'

type JobActionButtonProps = {
  jobId: string
  jobTitle: string
  companyName: string
  applyUrl: string | null
  initialDeclared?: boolean
  initialPrimaryEmail?: string | null
  className?: string
}

/** Section 4.5 — apply CTA + tab-visibility interceptor trigger. */
export function JobActionButton({
  jobId,
  jobTitle,
  companyName,
  applyUrl,
  initialDeclared = false,
  initialPrimaryEmail = null,
  className,
}: JobActionButtonProps) {
  const {
    state,
    showInterceptor,
    showFallback,
    primaryEmail,
    declareError,
    handleApplyClick,
    handleFallbackClick,
    handleConfirmDeclaration,
    closeInterceptor,
  } = useSelfDeclaration({
    jobId,
    applyUrl,
    initialDeclared,
    initialPrimaryEmail,
  })

  if (state === 'declared') {
    return (
      <div
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
          'font-arabic text-sm font-medium',
          'border border-emerald-200 bg-emerald-50 text-emerald-800',
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        مُسجَّل في رادارك
      </div>
    )
  }

  const hasApplyUrl = Boolean(applyUrl)
  const isBusy = state === 'in_progress'

  return (
    <>
      <div className={cn('space-y-2', className)}>
        <button
          type="button"
          disabled={!hasApplyUrl || isBusy}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
            'font-arabic text-sm font-medium transition-colors',
            hasApplyUrl
              ? 'bg-jid-olive text-jid-beige hover:bg-jid-olive-600 active:bg-jid-olive-700'
              : 'cursor-not-allowed bg-jid-line/30 text-jid-ink-500',
          )}
          aria-disabled={!hasApplyUrl || isBusy}
          onClick={handleApplyClick}
        >
          {isBusy ? 'جاري التسجيل...' : 'التقديم على موقع الجهة'}
          {hasApplyUrl ? <ExternalLink className="h-4 w-4 shrink-0" aria-hidden /> : null}
        </button>

        {(state === 'just_clicked' || state === 'in_progress') && showFallback ? (
          <button
            type="button"
            className={cn(
              'inline-flex w-full items-center justify-center rounded-lg px-4 py-2',
              'font-arabic text-xs font-medium text-jid-olive underline-offset-2 hover:underline',
            )}
            onClick={handleFallbackClick}
          >
            عدت من موقع التقديم؟ سجّل تقديمك هنا
          </button>
        ) : null}

        {!hasApplyUrl ? (
          <p className="text-center font-arabic text-xs text-jid-ink-400">رابط التقديم غير متاح</p>
        ) : null}
      </div>

      <InterceptorModal
        open={showInterceptor}
        onOpenChange={(open) => {
          if (!open) closeInterceptor()
        }}
        primaryEmail={primaryEmail}
        jobTitle={jobTitle}
        companyName={companyName}
        isSubmitting={state === 'in_progress'}
        errorMessage={declareError}
        onConfirm={handleConfirmDeclaration}
      />
    </>
  )
}
