'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { EmptyColumnState } from '@/components/radar/empty-column-state'
import { MobileApplicationCard } from '@/components/radar/mobile-application-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  groupApplicationsByColumn,
  RADAR_COLUMNS,
  type RadarColumnId,
} from '@/lib/radar/column-config'
import type { UserApplication } from '@/types/application'
import { cn } from '@/lib/utils'

type MobileKanbanProps = {
  userId: string
  applications: UserApplication[]
}

/** Section 11.1 — tabbed single-column Kanban for viewports <1024px. */
export function MobileKanban({ userId, applications }: MobileKanbanProps) {
  const t = useTranslations('radar.columns')
  const grouped = useMemo(() => groupApplicationsByColumn(applications), [applications])
  const [activeColumn, setActiveColumn] = useState<RadarColumnId>('saved')

  return (
    <Tabs
      value={activeColumn}
      onValueChange={(value) => setActiveColumn(value as RadarColumnId)}
      className="w-full"
    >
      <TabsList className="grid h-auto w-full grid-cols-4 gap-1 p-1">
        {RADAR_COLUMNS.map((column) => {
          const count = grouped[column.id].length
          return (
            <TabsTrigger
              key={column.id}
              value={column.id}
              className="flex flex-col gap-0.5 px-1 py-2 text-[10px] leading-tight sm:flex-row sm:text-xs"
            >
              <span className="line-clamp-2 font-arabic">{t(column.id)}</span>
              <span
                className={cn(
                  'inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 font-arabic text-[10px] font-semibold',
                  activeColumn === column.id
                    ? 'bg-jid-olive/15 text-jid-olive'
                    : 'bg-jid-line/30 text-jid-ink/55',
                )}
              >
                {count}
              </span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {RADAR_COLUMNS.map((column) => (
        <TabsContent key={column.id} value={column.id} className="mt-4 space-y-3">
          {grouped[column.id].length === 0 ? (
            <EmptyColumnState columnId={column.id} />
          ) : (
            grouped[column.id].map((application) => (
              <MobileApplicationCard
                key={application.id}
                application={application}
                columnId={column.id}
                userId={userId}
              />
            ))
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
