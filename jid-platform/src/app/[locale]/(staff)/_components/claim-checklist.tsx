'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2, Circle } from 'lucide-react'
import { emailDomainMatchesAllowed, formatDomainsList } from '@/lib/entity/domains'
import { cn } from '@/lib/utils'

export type ChecklistKey =
  | 'email_domain'
  | 'commercial_registry'
  | 'job_title'
  | 'linkedin'

export type ChecklistState = Record<ChecklistKey, boolean>

type ClaimChecklistProps = {
  businessEmail: string
  claimantTitle: string | null
  companyDomains: string[]
  value: ChecklistState
  onChange: (next: ChecklistState) => void
  disabled?: boolean
}

export function createDefaultChecklist(
  businessEmail: string,
  claimantTitle: string | null,
  companyDomains: string[],
): ChecklistState {
  return {
    email_domain: emailDomainMatchesAllowed(businessEmail, companyDomains),
    commercial_registry: false,
    job_title: Boolean(claimantTitle?.trim() && claimantTitle.trim().length >= 2),
    linkedin: false,
  }
}

export function ClaimChecklist({
  businessEmail,
  claimantTitle,
  companyDomains,
  value,
  onChange,
  disabled = false,
}: ClaimChecklistProps) {
  const t = useTranslations('staff.claimReview.checklist')

  const items: Array<{ key: ChecklistKey; label: string; hint?: string }> = [
    {
      key: 'email_domain',
      label: t('emailDomain'),
      hint: t('emailDomainHint', { domains: formatDomainsList(companyDomains) }),
    },
    { key: 'commercial_registry', label: t('commercialRegistry') },
  ]

  if (claimantTitle) {
    items.push({
      key: 'job_title',
      label: t('jobTitle'),
      hint: claimantTitle,
    })
  } else {
    items.push({ key: 'job_title', label: t('jobTitle') })
  }

  items.push({ key: 'linkedin', label: t('linkedin') })

  function toggle(key: ChecklistKey) {
    if (disabled) return
    onChange({ ...value, [key]: !value[key] })
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const checked = value[item.key]
        const Icon = checked ? CheckCircle2 : Circle

        return (
          <li key={item.key}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => toggle(item.key)}
              className={cn(
                'flex w-full items-start gap-3 rounded-md border p-3 text-start transition-colors',
                checked ? 'border-primary/25 bg-muted' : 'border-border bg-card',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <Icon
                className={cn('mt-0.5 h-5 w-5 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')}
              />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                {item.hint ? (
                  <p className="mt-1 text-xs text-muted-foreground" dir={item.key === 'email_domain' ? 'ltr' : undefined}>
                    {item.hint}
                  </p>
                ) : null}
                {item.key === 'email_domain' ? (
                  <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                    {businessEmail}
                  </p>
                ) : null}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function isChecklistComplete(value: ChecklistState): boolean {
  return Object.values(value).every(Boolean)
}
