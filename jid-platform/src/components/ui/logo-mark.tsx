'use client'

import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'

export function LogoMark() {
  const locale = useLocale()
  const isArabic = locale === 'ar'

  return (
    <div className="relative inline-flex select-none items-center">
      {isArabic ? (
        <div className="relative font-arabic text-2xl font-bold leading-none text-jid-olive dark:text-jid-beige">
          <span>جِد</span>
          <motion.span
            key="dot-ar"
            layoutId="logo-dot"
            className="absolute block h-1.5 w-1.5 rounded-full bg-jid-gold"
            initial={false}
            animate={{ bottom: '-4px', top: 'auto', right: '18px', left: 'auto' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="font-display relative text-2xl font-bold leading-none text-jid-olive dark:text-jid-beige">
          <span>JID</span>
          <motion.span
            key="dot-en"
            layoutId="logo-dot"
            className="absolute block h-1.5 w-1.5 rounded-full bg-jid-gold"
            initial={false}
            animate={{ top: '-4px', bottom: 'auto', left: '2px', right: 'auto' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}
