'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type InterceptorModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  primaryEmail: string | null
  jobTitle: string
  companyName: string
  isSubmitting?: boolean
  errorMessage?: string | null
  onConfirm: () => void
}

/**
 * Section 4.6 — post-apply self-declaration interceptor.
 * Copy structure per spec; email must be the user's verified primary email.
 */
export function InterceptorModal({
  open,
  onOpenChange,
  primaryEmail,
  jobTitle,
  companyName,
  isSubmitting = false,
  errorMessage,
  onConfirm,
}: InterceptorModalProps) {
  const emailDisplay = primaryEmail ?? '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-border/50 bg-card font-arabic text-foreground"
        dir="rtl"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader className="space-y-3 text-right sm:text-right">
          <DialogTitle className="font-arabic text-lg font-semibold text-foreground">
            هل أكملت التقديم؟
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                إذا قدّمت على <span className="font-medium text-foreground">{companyName}</span> لفرصة{' '}
                <span className="font-medium text-foreground">{jobTitle}</span>، يمكنك تسجيل ذلك في رادار
                جِد لمتابعة حالة طلبك.
              </p>
              <p>
                لن نرسل سيرتك الذاتية تلقائياً — نسجّل فقط أنك تقدّمت خارج المنصة لنذكّرك ونتابع مع
                الجهة عند توفر تحديثات.
              </p>
              <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">بريدك الموثّق في جِد</p>
                <p dir="ltr" className="mt-1 font-mono text-sm font-medium text-primary">
                  {emailDisplay}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                يرى صاحب العمل إعلان تقدّمك فقط — وليس محتوى طلبك على موقعهم.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            className={cn(
              'w-full font-arabic',
              'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
            disabled={isSubmitting || !primaryEmail}
            onClick={onConfirm}
          >
            {isSubmitting ? 'جاري التسجيل...' : 'نعم، سجّلت تقديمي في الرادار'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full font-arabic border-border text-foreground hover:bg-background"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            ليس بعد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
