'use client'

import { Link } from '@/lib/i18n/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { WorkshopsTab } from './workshops-tab'
import { MentorHubStubTab } from './mentor-hub-stub-tab'
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

export function MentorHubDashboard({
  kpis,
  pendingRequests: initialPending,
  settings,
  workshops,
}: MentorHubDashboardProps) {
  const t = useTranslations('mentorship.hub')
  const [activeTab, setActiveTab] = useState<MentorHubTab>('requests')
  const [pendingRequests, setPendingRequests] = useState(initialPending)

  function handleReviewed(requestId: string) {
    setPendingRequests((current) => current.filter((item) => item.id !== requestId))
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-arabic text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 font-arabic text-sm text-jid-ink/60">{t('subtitle')}</p>
      </header>

      <nav
        className="flex flex-wrap gap-2 border-b border-jid-line pb-3"
        aria-label={t('tabsAria')}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-lg px-3 py-1.5 font-arabic text-sm transition-colors',
              activeTab === tab
                ? 'bg-jid-olive text-white'
                : 'text-jid-ink/70 hover:bg-jid-beige/50',
            )}
          >
            {t(`tabs.${tab}`)}
            {tab === 'requests' && kpis.pendingCount > 0 ? (
              <span className="ms-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                {kpis.pendingCount}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {activeTab === 'requests' ? (
        <section className="space-y-4">
          {pendingRequests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-jid-line py-12 text-center font-arabic text-sm text-jid-ink/55">
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
        <div className="rounded-xl border border-jid-line bg-white px-6 py-8 text-center">
          <p className="font-arabic text-sm text-jid-ink/70">{t('stubs.chats.body')}</p>
          <Button asChild className="mt-4 bg-jid-olive font-arabic hover:bg-jid-olive/90">
            <Link href="/conversations">{t('stubs.chats.openCta')}</Link>
          </Button>
        </div>
      ) : null}
      {activeTab === 'upcoming' ? (
        <div className="rounded-xl border border-jid-line bg-white px-6 py-8 text-center">
          <p className="font-arabic text-sm text-jid-ink/70">{t('stubs.upcoming.body')}</p>
          <Button asChild className="mt-4 bg-jid-olive font-arabic hover:bg-jid-olive/90">
            <Link href="/radar">{t('stubs.upcoming.openCta')}</Link>
          </Button>
        </div>
      ) : null}
      {activeTab === 'workshops' ? <WorkshopsTab initialWorkshops={workshops} /> : null}
      {activeTab === 'settings' ? <MentorSettingsTab settings={settings} /> : null}
    </div>
  )
}
