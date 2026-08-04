'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

const links = [
  ['overview','/staff/lammah'],
  ['review','/staff/lammah/review'],
  ['mapping','/staff/lammah/mapping'],
  ['deadLetters','/staff/lammah/dead-letters'],
  ['runs','/staff/lammah/runs'],
] as const

export function LammahNav() {
  const t=useTranslations('staff.lammah.nav')
  return (
    <nav aria-label={t('ariaLabel')} className="flex flex-wrap gap-2">
      {links.map(([key,href])=>(
        <Link key={key} href={href} className="rounded-full border border-border bg-card px-3 py-1.5 font-arabic text-sm text-foreground hover:border-primary/40">
          {t(key)}
        </Link>
      ))}
    </nav>
  )
}
