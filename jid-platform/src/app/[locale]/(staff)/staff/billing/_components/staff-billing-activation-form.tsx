'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { activateCompanyPlan } from '../actions'

export function StaffBillingActivationForm() {
  const t = useTranslations('monetization.staffBilling')
  const [companyId, setCompanyId] = useState('')
  const [planKey, setPlanKey] = useState<'employer_premium' | 'employer_enterprise'>('employer_premium')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await activateCompanyPlan({
        companyId,
        planKey,
        billingCycle,
        reason,
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(t('activationSuccess'))
      setReason('')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="companyId" className="font-arabic">
          {t('companyId')}
        </Label>
        <Input
          id="companyId"
          value={companyId}
          onChange={(event) => setCompanyId(event.target.value)}
          placeholder={t('companyIdPlaceholder')}
          required
          className="font-latin"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="planKey" className="font-arabic">
            {t('plan')}
          </Label>
          <select
            id="planKey"
            value={planKey}
            onChange={(event) =>
              setPlanKey(event.target.value as 'employer_premium' | 'employer_enterprise')
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="employer_premium">{t('plans.employer_premium')}</option>
            <option value="employer_enterprise">{t('plans.employer_enterprise')}</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billingCycle" className="font-arabic">
            {t('billingCycle')}
          </Label>
          <select
            id="billingCycle"
            value={billingCycle}
            onChange={(event) => setBillingCycle(event.target.value as 'monthly' | 'yearly')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="yearly">{t('yearly')}</option>
            <option value="monthly">{t('monthly')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason" className="font-arabic">
          {t('reason')}
        </Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t('reasonPlaceholder')}
          required
          minLength={10}
          rows={3}
          className="font-arabic"
        />
        <p className="font-arabic text-xs text-muted-foreground">{t('reasonHint')}</p>
      </div>

      <Button type="submit" disabled={isPending} className="font-arabic">
        {isPending ? t('activating') : t('activateCta')}
      </Button>
    </form>
  )
}
