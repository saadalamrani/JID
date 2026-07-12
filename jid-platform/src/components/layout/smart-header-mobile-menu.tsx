'use client'

import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Link, usePathname } from '@/lib/i18n/navigation'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { cn } from '@/lib/utils'
import type { SmartNavItem } from '@/components/layout/smart-header-nav'

type SmartHeaderMobileMenuProps = {
  items: readonly SmartNavItem[]
  isActive: (href: string) => boolean
}

/** Accessible mobile nav — Radix Dialog focus trap + Escape (no prior mobile menu existed). */
export function SmartHeaderMobileMenu({ items, isActive }: SmartHeaderMobileMenuProps) {
  const t = useTranslations('publicShell.nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-jid-beige/90 transition-colors hover:bg-jid-olive-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-gold md:hidden"
        aria-label={t('menuOpen')}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            'fixed inset-y-0 end-0 start-auto z-50 flex h-full w-[min(100vw,20rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-s border-border p-0 sm:rounded-none',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          )}
        >
          <DialogHeader className="border-b border-border px-4 py-4 text-start">
            <DialogTitle className="font-arabic text-base text-foreground">
              {t('menuTitle')}
            </DialogTitle>
          </DialogHeader>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={t('primaryAria')}>
            {items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-muted text-foreground underline decoration-jid-gold decoration-2 underline-offset-4'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {t(item.labelKey)}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-border p-4">
            <LanguageSwitcher tone="default" className="w-full justify-center" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
