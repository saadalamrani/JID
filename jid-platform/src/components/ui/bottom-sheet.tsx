'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: ReactNode
  fullScreen?: boolean
  className?: string
  /**
   * 'bottom' (default) — mobile action/timeline sheet, slides up from the
   * bottom edge. 'start' — a side nav drawer anchored to the logical start
   * edge (right in RTL, left in LTR), for collapsing a desktop sidebar into
   * a drawer on small viewports.
   */
  side?: 'bottom' | 'start'
  widthClassName?: string
}

/** Section 11.1 / 11.2 — mobile bottom sheet (move actions + timeline) and side nav drawer. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  fullScreen = false,
  className,
  side = 'bottom',
  widthClassName = 'w-[85vw] max-w-xs',
}: BottomSheetProps) {
  const isSide = side === 'start'

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-foreground/50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 flex flex-col bg-card text-foreground shadow-lg outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:duration-fast data-[state=open]:duration-normal',
            isSide &&
              cn(
                'inset-y-0 start-0 h-full',
                widthClassName,
                'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
                'rtl:data-[state=closed]:slide-out-to-right rtl:data-[state=open]:slide-in-from-right',
              ),
            !isSide &&
              (fullScreen
                ? cn(
                    'inset-0 h-full w-full',
                    'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                  )
                : cn(
                    'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl',
                    'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                  )),
            className,
          )}
        >
          {!isSide ? (
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border/60" aria-hidden />
          ) : null}
          {title ? (
            <DialogPrimitive.Title className="border-b border-border px-4 py-3 text-base font-semibold text-foreground">
              {title}
            </DialogPrimitive.Title>
          ) : null}
          <div className={cn('flex-1 overflow-y-auto', fullScreen || isSide ? 'p-4' : 'p-4 pb-8')}>
            {children}
          </div>
          <DialogPrimitive.Close
            className="absolute end-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
