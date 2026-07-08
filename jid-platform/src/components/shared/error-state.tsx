'use client'

import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { radius } from '@/lib/ui/consistency'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  secondaryAction?: ReactNode
  showIcon?: boolean
  className?: string
}

/** Part 7 — unified error boundary visual treatment. */
export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
  secondaryAction,
  showIcon = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        radius.xl,
        'border border-destructive/30 bg-destructive/10 p-6 text-center',
        className,
      )}
      role="alert"
    >
      {showIcon ? (
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive/70" aria-hidden />
      ) : null}
      <h1
        className={cn(
          'font-arabic text-lg font-semibold text-destructive',
          showIcon && 'mt-3',
        )}
      >
        {title}
      </h1>
      {message ? <p className="mt-2 font-arabic text-sm text-destructive/90">{message}</p> : null}
      {(onRetry || secondaryAction) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry} className="font-arabic">
              {retryLabel}
            </Button>
          ) : null}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

/** Full-page error shell used by route-level error.tsx boundaries. */
export function ErrorPageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <main
      className={cn(
        'container-jid flex min-h-[50vh] flex-col items-center justify-center gap-4 py-8',
        className,
      )}
    >
      {children}
    </main>
  )
}
