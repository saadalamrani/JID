'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { iconOnlyControlClass, reducedMotionClass } from '@/lib/ui/a11y'
import { cn } from '@/lib/utils'

export type SheetSide = 'start' | 'end' | 'bottom'

export type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  side?: SheetSide
  closeLabel?: string
  className?: string
}

const sidePositionClass: Record<SheetSide, string> = {
  start: cn(
    'inset-y-0 start-0 h-full w-[min(100%,24rem)]',
    'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
    'rtl:data-[state=closed]:slide-out-to-right rtl:data-[state=open]:slide-in-from-right',
  ),
  end: cn(
    'inset-y-0 end-0 h-full w-[min(100%,24rem)]',
    'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
    'rtl:data-[state=closed]:slide-out-to-left rtl:data-[state=open]:slide-in-from-left',
  ),
  bottom: cn(
    'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-xl',
    'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
  ),
}

/**
 * Shared overlay sheet — RTL/LTR logical edges, reduced-motion, and a named close control.
 * Does not replace domain BottomSheet consumers; later waves should prefer this primitive.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'end',
  closeLabel = 'Close',
  className,
}: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'bg-foreground/50 fixed inset-0 z-50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            reducedMotionClass,
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 flex max-h-dvh flex-col overflow-hidden border border-border bg-background text-foreground shadow-lg outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:duration-fast data-[state=open]:duration-normal',
            reducedMotionClass,
            sidePositionClass[side],
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0 pe-12">
              <DialogPrimitive.Title className="text-base font-semibold tracking-normal text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">
                  {title}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className={cn(
                'absolute end-3 top-3 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground',
                iconOnlyControlClass,
              )}
              aria-label={closeLabel}
            >
              <X className="h-5 w-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
