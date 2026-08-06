'use client'

import { Link, usePathname, useRouter } from '@/lib/i18n/navigation'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { WorkshopsTab } from './workshops-tab'
import { MentorSettingsTab } from './mentor-settings-tab'
import { PendingRequestCard } from './pending-request-card'
import type { MentorHubKpis, MentorHubSettings } from '@/lib/mentor-hub/queries'
import type { MentorshipRequestRecord } from '@/types/mentorship-request'
import { cn } from '@/lib/utils'

type MentorHubTab = 'requests' | 'chats' | 'upcoming' | 'workshops' | 'settings'

import type { MentorWorkshopRow } from '@/lib/mentor-workshops/crud'

type MentorHubDashboardProps = {
  kpis: MentorHubKpis
  pendingRequests: MentorshipRequestRecord[]
  settings: MentorHubSettings
  workshops: MentorWorkshopRow[]
}

const TABS: MentorHubTab[] = ['requests', 'chats', 'upcoming', 'workshops', 'settings']

function parseTab(value: string | null): MentorHubTab {
  if (value && (TABS as readonly string[]).includes(value)) {
    return value as MentorHubTab
  }
  return 'requests'
}

export function MentorHubDashboard({
  kpis,
  pendingRequests: initialPending,
  settings,
  workshops,
}: MentorHubDashboardProps) {
  const t = useTranslations('mentorship.hub')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<MentorHubTab>(() => parseTab(searchParams.get('tab')))
  const [pendingRequests, setPendingRequests] = useState(initialPending)

  useEffect(() => {
    setActiveTab(parseTab(searchParams.get('tab')))
  }, [searchParams])

  function selectTab(tab: MentorHubTab) {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'requests') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  function handleReviewed(requestId: string) {
    setPendingRequests((current) => current.filter((item) => item.id !== requestId))
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-arabic text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-border pb-3" aria-label={t('tabsAria')}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => selectTab(tab)}
            className={cn(
              'rounded-lg px-3 py-1.5 font-arabic text-sm transition-colors',
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-background/50 text-muted-foreground',
            )}
          >
            {t(`tabs.${tab}`)}
            {tab === 'requests' && kpis.pendingCount > 0 ? (
              <span className="bg-card/20 ms-1.5 rounded-full px-1.5 text-xs">
                {kpis.pendingCount}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {activeTab === 'requests' ? (
        <section className="space-y-4">
          {pendingRequests.length === 0 ? (
            <p className="text-foreground/55 rounded-xl border border-dashed border-border py-12 text-center font-arabic text-sm">
              {t('requests.empty')}
            </p>
          ) : (
            pendingRequests.map((request) => (
              <PendingRequestCard
                key={request.id}
                request={request}
                onReviewed={() => handleReviewed(request.id)}
              />
            ))
          )}
        </section>
      ) : null}

      {activeTab === 'chats' ? (
        <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
          <p className="font-arabic text-sm text-muted-foreground">{t('stubs.chats.body')}</p>
          <Button asChild className="hover:bg-primary/90 mt-4 bg-primary font-arabic">
            <Link href="/conversations">{t('stubs.chats.openCta')}</Link>
          </Button>
        </div>
      ) : null}
      {activeTab === 'upcoming' ? (
        <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
          <p className="font-arabic text-sm text-muted-foreground">{t('stubs.upcoming.body')}</p>
          <Button asChild className="hover:bg-primary/90 mt-4 bg-primary font-arabic">
            <Link href="/radar">{t('stubs.upcoming.openCta')}</Link>
          </Button>
        </div>
      ) : null}
      {activeTab === 'workshops' ? <WorkshopsTab initialWorkshops={workshops} /> : null}
      {activeTab === 'settings' ? <MentorSettingsTab settings={settings} /> : null}
    </div>
  )
}
