'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { track } from '@/lib/analytics/track'
import { saveEntityTeamInvites } from '@/lib/onboarding/entity-actions'
import {
  entityTeamInvitesSchema,
  type EntityTeamInvitesValues,
} from '@/lib/validations/entity-onboarding'

type TeamFormValues = {
  invites: string[]
}

/** Task 2 — invite up to 3 colleagues (optional; staff_invitations pattern). */
export function EntityTeamForm() {
  const t = useTranslations('onboarding.entity.team')
  const [isPending, startTransition] = useTransition()
  const [rowCount, setRowCount] = useState(1)

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(entityTeamInvitesSchema),
    defaultValues: { invites: [''] },
    mode: 'onBlur',
  })

  function onSubmit(values: TeamFormValues) {
    const cleaned = values.invites.map((email) => email.trim()).filter(Boolean)
    const parsed = entityTeamInvitesSchema.safeParse({ invites: cleaned })
    if (!parsed.success) {
      toast.error(t('saveFailed'))
      return
    }

    startTransition(async () => {
      track('entity_team_invites_sent', { count: cleaned.length })
      const result = await saveEntityTeamInvites(parsed.data)
      if (!result.ok) {
        toast.error(t('saveFailed'))
      } else {
        track('entity_setup_completed')
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <p className="text-sm text-jid-ink/65">{t('intro')}</p>

      <div className="space-y-3">
        {Array.from({ length: rowCount }, (_, index) => (
          <div key={index} className="flex gap-2">
            <FormField
              id={`invite-${index}`}
              label={index === 0 ? t('emailLabel') : `${t('emailLabel')} ${index + 1}`}
              className="flex-1"
            >
              <Input
                id={`invite-${index}`}
                type="email"
                dir="ltr"
                disabled={isPending}
                {...form.register(`invites.${index}` as const)}
              />
            </FormField>
            {rowCount > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-7 shrink-0"
                onClick={() => {
                  const current = form.getValues('invites')
                  form.setValue(
                    'invites',
                    current.filter((_, rowIndex) => rowIndex !== index),
                  )
                  setRowCount((count) => count - 1)
                }}
                disabled={isPending}
                aria-label={t('removeInvite')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {rowCount < 3 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            form.setValue('invites', [...form.getValues('invites'), ''])
            setRowCount((count) => count + 1)
          }}
          disabled={isPending}
        >
          <Plus className="me-2 h-4 w-4" />
          {t('addInvite')}
        </Button>
      ) : null}

      <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={isPending}>
        {isPending ? t('saving') : t('finish')}
      </Button>
    </form>
  )
}
