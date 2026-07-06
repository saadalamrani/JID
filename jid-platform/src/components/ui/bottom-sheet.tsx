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
}

/** Section 11.1 / 11.2 — mobile bottom sheet (move actions + timeline). */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  fullScreen = false,
  className,
}: BottomSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 flex flex-col bg-white shadow-lg outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:duration-200 data-[state=open]:duration-300',
            fullScreen
              ? cn(
                  'inset-0 h-full w-full',
                  'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                )
              : cn(
                  'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl',
                  'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                ),
            className,
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-jid-line/60" aria-hidden />
          {title ? (
            <DialogPrimitive.Title className="border-b border-jid-line/40 px-4 py-3 font-arabic text-base font-semibold text-jid-ink">
              {title}
            </DialogPrimitive.Title>
          ) : null}
          <div className={cn('flex-1 overflow-y-auto', fullScreen ? 'p-4' : 'p-4 pb-8')}>
            {children}
          </div>
          <DialogPrimitive.Close
            className="absolute end-4 top-4 rounded-full p-1.5 text-jid-ink/60 hover:bg-jid-beige/50 hover:text-jid-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
