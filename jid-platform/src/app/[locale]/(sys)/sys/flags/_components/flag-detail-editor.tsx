'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import type { FeatureFlag } from '@/lib/governance/schemas'
import { userRoleSchema, type UserRole } from '@/lib/governance/schemas'
import type { UserOverrideRow } from '@/lib/sys/feature-flags'
import {
  removeUserOverride,
  setRoleOverride,
  setUserOverride,
  toggleFlagGlobally,
} from '@/app/[locale]/(sys)/sys/flags/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConfirmDialog } from './confirm-dialog'

const ROLE_OPTIONS = userRoleSchema.options

type PendingAction =
  | { type: 'global'; enabled: boolean }
  | { type: 'roles' }
  | { type: 'addUser'; enabled: boolean }
  | { type: 'removeUser'; userId: string }

type FlagDetailEditorProps = {
  flag: FeatureFlag
  overrideRows: UserOverrideRow[]
}

export function FlagDetailEditor({ flag, overrideRows }: FlagDetailEditorProps) {
  const t = useTranslations('sys.flags.detail')
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [globalEnabled, setGlobalEnabled] = useState(flag.is_enabled)
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(flag.enabled_for_roles)
  const [userQuery, setUserQuery] = useState('')
  const [userOverrideEnabled, setUserOverrideEnabled] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setGlobalEnabled(flag.is_enabled)
    setSelectedRoles(flag.enabled_for_roles)
  }, [flag])

  const label = locale === 'ar' ? flag.label_ar : flag.label_en
  const description = locale === 'ar' ? flag.description_ar : flag.description_en

  const confirmCopy = useMemo(() => {
    if (!pendingAction) return { title: '', description: '' }
    switch (pendingAction.type) {
      case 'global':
        return {
          title: pendingAction.enabled ? t('enableTitle') : t('disableTitle'),
          description: t('confirmGlobal'),
        }
      case 'roles':
        return { title: t('saveRolesTitle'), description: t('confirmRoles') }
      case 'addUser':
        return { title: t('addUserTitle'), description: t('confirmAddUser') }
      case 'removeUser':
        return { title: t('removeUserTitle'), description: t('confirmRemoveUser') }
      default:
        return { title: '', description: '' }
    }
  }, [pendingAction, t])

  const runConfirm = async (reason: string) => {
    if (!pendingAction) return

    let result: Awaited<ReturnType<typeof toggleFlagGlobally>>
    switch (pendingAction.type) {
      case 'global':
        result = await toggleFlagGlobally(flag.key, pendingAction.enabled, reason)
        break
      case 'roles':
        result = await setRoleOverride(flag.key, selectedRoles, reason)
        break
      case 'addUser':
        result = await setUserOverride(flag.key, userQuery, userOverrideEnabled, reason)
        break
      case 'removeUser':
        result = await removeUserOverride(flag.key, pendingAction.userId, reason)
        break
      default:
        return
    }

    if (!result.ok) throw new Error(result.error)
    setMessage(t('saved'))
    startTransition(() => router.refresh())
  }

  const toggleRole = (role: UserRole) => {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-jid-ink/50">{flag.key}</p>
        <h1 className="text-2xl font-semibold text-jid-ink">{label}</h1>
        {description ? <p className="mt-1 text-sm text-jid-ink/70">{description}</p> : null}
        {message ? <p className="mt-2 text-sm text-jid-olive">{message}</p> : null}
      </header>

      <section className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('layer1Title')}</h2>
        <p className="mt-1 text-sm text-jid-ink/55">{t('layer1Hint')}</p>
        <div className="mt-4 flex items-center gap-3">
          <Switch
            checked={globalEnabled}
            onCheckedChange={(checked) => {
              setGlobalEnabled(checked)
              setPendingAction({ type: 'global', enabled: checked })
              setConfirmOpen(true)
            }}
            disabled={pending}
            aria-label={t('globalToggleAria')}
          />
          <span className="text-sm text-jid-ink">{globalEnabled ? t('enabled') : t('disabled')}</span>
        </div>
      </section>

      <section className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('layer2Title')}</h2>
        <p className="mt-1 text-sm text-jid-ink/55">{t('layer2Hint')}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm text-jid-ink">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => toggleRole(role)}
                className="h-4 w-4 rounded border-jid-line text-jid-olive focus:ring-jid-olive"
              />
              {t(`roles.${role}`)}
            </label>
          ))}
        </div>
        <Button
          type="button"
          className="mt-4"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setPendingAction({ type: 'roles' })
            setConfirmOpen(true)
          }}
        >
          {t('saveRoles')}
        </Button>
      </section>

      <section className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('layer3Title')}</h2>
        <p className="mt-1 text-sm text-jid-ink/55">{t('layer3Hint')}</p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1 space-y-1">
            <Label htmlFor="user-override-query">{t('userSearchLabel')}</Label>
            <Input
              id="user-override-query"
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder={t('userSearchPlaceholder')}
            />
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Switch
              checked={userOverrideEnabled}
              onCheckedChange={setUserOverrideEnabled}
              aria-label={t('userOverrideValueAria')}
            />
            <span className="text-sm text-jid-ink">
              {userOverrideEnabled ? t('forceEnable') : t('forceDisable')}
            </span>
          </div>
          <Button
            type="button"
            disabled={pending || !userQuery.trim()}
            onClick={() => {
              setPendingAction({ type: 'addUser', enabled: userOverrideEnabled })
              setConfirmOpen(true)
            }}
          >
            {t('addOverride')}
          </Button>
        </div>

        <div className="mt-6 overflow-x-auto rounded-md border border-jid-line">
          <table className="min-w-full text-sm">
            <thead className="bg-jid-beige/50 text-start">
              <tr>
                <th className="px-4 py-3 font-medium">{t('table.user')}</th>
                <th className="px-4 py-3 font-medium">{t('table.override')}</th>
                <th className="px-4 py-3 font-medium">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jid-line">
              {overrideRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-jid-ink/50">
                    {t('table.empty')}
                  </td>
                </tr>
              ) : (
                overrideRows.map((row) => (
                  <tr key={row.user_id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-jid-ink">{row.full_name ?? t('unnamedUser')}</p>
                      <p className="font-mono text-xs text-jid-ink/50">{row.user_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      {row.enabled ? t('forceEnable') : t('forceDisable')}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          setPendingAction({ type: 'removeUser', userId: row.user_id })
                          setConfirmOpen(true)
                        }}
                      >
                        {t('removeOverride')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmCopy.title}
        description={confirmCopy.description}
        destructive={
          pendingAction?.type === 'global'
            ? !pendingAction.enabled
            : pendingAction?.type === 'removeUser'
        }
        onConfirm={runConfirm}
      />
    </div>
  )
}
