'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import {
  triggerMaintenanceMode,
  revertMaintenanceMode,
  triggerRegistrationsClosed,
  revertRegistrationsOpen,
} from '@/app/[locale]/(sys)/sys/system/emergency/actions'
import { KillSwitchCard } from '@/app/[locale]/(sys)/sys/system/emergency/_components/kill-switch-card'

type EmergencyControlsProps = {
  maintenanceEnabled: boolean
  registrationsOpen: boolean
  activeMaintenanceId: string | null
  activeRegistrationsId: string | null
}

export function EmergencyControls({
  maintenanceEnabled,
  registrationsOpen,
  activeMaintenanceId,
  activeRegistrationsId,
}: EmergencyControlsProps) {
  const t = useTranslations('sys.emergency.killSwitch')
  const router = useRouter()
  const [, startTransition] = useTransition()

  const refresh = () => startTransition(() => router.refresh())

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <KillSwitchCard
        title={t('maintenanceTitle')}
        description={t('maintenanceDescription')}
        isOn={maintenanceEnabled}
        onActivate={async (reason) => {
          const result = await triggerMaintenanceMode(reason)
          if (!result.ok) throw new Error(result.error)
          refresh()
        }}
        onDeactivate={async (reason) => {
          if (!activeMaintenanceId) throw new Error('No active maintenance emergency record')
          const result = await revertMaintenanceMode(activeMaintenanceId, reason)
          if (!result.ok) throw new Error(result.error)
          refresh()
        }}
      />
      <KillSwitchCard
        title={t('registrationsTitle')}
        description={t('registrationsDescription')}
        isOn={registrationsOpen}
        invertDisplay
        onActivate={async (reason) => {
          const result = await triggerRegistrationsClosed(reason)
          if (!result.ok) throw new Error(result.error)
          refresh()
        }}
        onDeactivate={async (reason) => {
          if (!activeRegistrationsId) throw new Error('No active registrations emergency record')
          const result = await revertRegistrationsOpen(activeRegistrationsId, reason)
          if (!result.ok) throw new Error(result.error)
          refresh()
        }}
      />
    </div>
  )
}
