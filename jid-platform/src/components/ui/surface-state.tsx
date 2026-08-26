import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { type SurfaceState } from '@/lib/ui/surface-state'
import { cn } from '@/lib/utils'

type SurfaceStateBase = {
  className?: string
}

export type SurfaceStateProps = SurfaceStateBase &
  (
    | { state: 'loading'; label: string }
    | { state: 'ready'; children: ReactNode }
    | { state: 'empty'; title: string; description?: string; action?: ReactNode }
    | {
        state: 'error'
        title: string
        message?: string
        onRetry?: () => void
        retryLabel?: string
      }
    | { state: 'forbidden'; title: string; message: string; action?: ReactNode }
    | { state: 'unavailable'; title: string; message: string }
    | { state: 'stale'; title: string; message: string; asOfLabel?: string; children?: ReactNode }
  )

function SurfaceFrame({
  className,
  role,
  'aria-live': ariaLive,
  'aria-busy': ariaBusy,
  children,
}: {
  className?: string
  role?: 'status' | 'alert'
  'aria-live'?: 'polite' | 'assertive'
  'aria-busy'?: boolean
  children: ReactNode
}) {
  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-busy={ariaBusy}
      className={cn('w-full max-w-2xl py-8 text-start', className)}
    >
      {children}
    </div>
  )
}

/**
 * Truthful shared surface states for later waves.
 * Missing numbers are not rendered as zero; forbidden is a dedicated state, not hidden data.
 */
export function SurfaceStateView(props: SurfaceStateProps) {
  switch (props.state) {
    case 'loading':
      return (
        <SurfaceFrame className={props.className} role="status" aria-live="polite" aria-busy>
          <p className="sr-only">{props.label}</p>
          <div className="space-y-3" aria-hidden>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </SurfaceFrame>
      )
    case 'ready':
      return <div className={props.className}>{props.children}</div>
    case 'empty':
      return (
        <SurfaceFrame className={props.className} role="status" aria-live="polite">
          <h2 className="text-lg font-semibold tracking-normal text-foreground">{props.title}</h2>
          {props.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{props.description}</p>
          ) : null}
          {props.action ? <div className="mt-4">{props.action}</div> : null}
        </SurfaceFrame>
      )
    case 'error':
      return (
        <SurfaceFrame className={props.className} role="alert" aria-live="assertive">
          <h2 className="text-lg font-semibold tracking-normal text-foreground">{props.title}</h2>
          {props.message ? (
            <p className="mt-2 text-sm text-muted-foreground">{props.message}</p>
          ) : null}
          {props.onRetry ? (
            <button
              type="button"
              onClick={props.onRetry}
              className="mt-4 inline-flex min-h-11 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {props.retryLabel ?? 'Retry'}
            </button>
          ) : null}
        </SurfaceFrame>
      )
    case 'forbidden':
      return (
        <SurfaceFrame className={props.className} role="alert" aria-live="assertive">
          <h2 className="text-lg font-semibold tracking-normal text-foreground">{props.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{props.message}</p>
          {props.action ? <div className="mt-4">{props.action}</div> : null}
        </SurfaceFrame>
      )
    case 'unavailable':
      return (
        <SurfaceFrame className={props.className} role="status" aria-live="polite">
          <h2 className="text-lg font-semibold tracking-normal text-foreground">{props.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{props.message}</p>
        </SurfaceFrame>
      )
    case 'stale':
      return (
        <SurfaceFrame className={props.className} role="status" aria-live="polite">
          <p className="text-sm font-medium text-foreground">
            {props.title}
            {props.asOfLabel ? (
              <span className="ms-2 font-normal text-muted-foreground">({props.asOfLabel})</span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{props.message}</p>
          {props.children}
        </SurfaceFrame>
      )
  }
}

export type { SurfaceState }
