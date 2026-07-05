import { getTranslations } from 'next-intl/server'
import { fetchSysAuditLogs } from '@/lib/auth/audit-logs'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/lib/i18n/navigation'

export default async function SysAuditPage() {
  const t = await getTranslations('sys.audit')
  const supabase = await createClient()
  const logs = await fetchSysAuditLogs(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
          <p className="mt-2 text-sm text-jid-ink/70">{t('subtitle')}</p>
        </div>
        <Link href="/sys/dashboard" className="text-sm text-jid-olive hover:underline">
          {t('back')}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-jid-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-jid-beige/50 text-start">
            <tr>
              <th className="px-4 py-3 font-medium">{t('columns.time')}</th>
              <th className="px-4 py-3 font-medium">{t('columns.actor')}</th>
              <th className="px-4 py-3 font-medium">{t('columns.action')}</th>
              <th className="px-4 py-3 font-medium">{t('columns.entity')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-jid-line">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-jid-ink/70">{new Date(log.created_at).toLocaleString('ar-SA')}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.actor_id?.slice(0, 8) ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3 text-jid-ink/70">
                  {log.entity_type}
                  {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 ? <p className="p-6 text-center text-sm text-jid-ink/60">{t('empty')}</p> : null}
      </div>
    </div>
  )
}
