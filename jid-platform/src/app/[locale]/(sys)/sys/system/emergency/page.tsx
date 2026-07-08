import { getTranslations } from 'next-intl/server'
import { EmergencyControls } from '@/app/[locale]/(sys)/sys/system/emergency/_components/emergency-controls'
import { EmergencyHistory } from '@/app/[locale]/(sys)/sys/system/emergency/_components/emergency-history'
import { fetchActiveEmergency, fetchEmergencyHistory } from '@/lib/sys/emergency-queries'
import { getPlatformGates } from '@/lib/sys/platform-gates'

/** Section 11 — emergency kill switches + history. */
export default async function SysEmergencyPage() {
  const t = await getTranslations('sys.emergency')

  const [gates, history, activeMaintenance, activeRegistrations] = await Promise.all([
    getPlatformGates(),
    fetchEmergencyHistory(20),
    fetchActiveEmergency('maintenance_mode'),
    fetchActiveEmergency('registrations_open'),
  ])

  return (
    <div className="space-y-8">
      <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-5">
        <h1 className="text-xl font-bold text-destructive">{t('banner.title')}</h1>
        <p className="mt-2 text-sm text-destructive">{t('banner.description')}</p>
      </div>

      <header>
        <h2 className="text-2xl font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <EmergencyControls
        maintenanceEnabled={gates.maintenance.enabled}
        registrationsOpen={gates.registrationsOpen}
        activeMaintenanceId={activeMaintenance?.id ?? null}
        activeRegistrationsId={activeRegistrations?.id ?? null}
      />

      <section>
        <h3 className="mb-3 text-lg font-semibold text-foreground">{t('historyTitle')}</h3>
        <EmergencyHistory actions={history} />
      </section>
    </div>
  )
}
