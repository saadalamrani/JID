'use client'

import { useTranslations } from 'next-intl'
import type { PlatformConfigByCategory } from '@/lib/sys/platform-config-queries'
import { ConfigRow } from '@/app/[locale]/(sys)/sys/config/_components/config-row'

type ConfigGroupedListProps = {
  grouped: PlatformConfigByCategory
}

export function ConfigGroupedList({ grouped }: ConfigGroupedListProps) {
  const t = useTranslations('sys.config.categories')

  return (
    <div className="space-y-8">
      {(Object.keys(grouped) as Array<keyof PlatformConfigByCategory>).map((category) => {
        const rows = grouped[category]
        if (rows.length === 0) return null
        return (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-jid-ink/45">
              {t(category)}
            </h2>
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row.key}>
                  <ConfigRow config={row} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
