'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { fetchActiveSessions, revokeActiveSession } from '@/lib/auth/sessions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const sessionsKey = ['active-sessions'] as const

export function SessionList() {
  const t = useTranslations('auth.sessions')
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: sessionsKey,
    queryFn: async () => {
      const supabase = createClient()
      return fetchActiveSessions(supabase)
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const supabase = createClient()
      await revokeActiveSession(supabase, sessionId)
    },
    onSuccess: () => {
      toast.success(t('revoked'))
      void queryClient.invalidateQueries({ queryKey: sessionsKey })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (isLoading) return <p className="text-sm text-jid-ink/60">{t('loading')}</p>
  if (isError) return <p className="text-sm text-red-600">{t('error')}</p>
  if (!data?.length) return <p className="text-sm text-jid-ink/60">{t('empty')}</p>

  return (
    <ul className="divide-y divide-jid-line rounded-md border border-jid-line bg-white">
      {data.map((session) => (
        <li key={session.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-jid-ink">{session.device_label ?? t('unknownDevice')}</p>
            <p className="text-xs text-jid-ink/60">{session.user_agent ?? '—'}</p>
            <p className="text-xs text-jid-ink/50">
              {t('lastActive')}: {new Date(session.last_active_at).toLocaleString('ar-SA')}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={revokeMutation.isPending}
            onClick={() => revokeMutation.mutate(session.id)}
          >
            {t('revoke')}
          </Button>
        </li>
      ))}
    </ul>
  )
}
