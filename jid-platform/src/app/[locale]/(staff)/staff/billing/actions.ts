'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { activateCompanySubscriptionManual } from '@/lib/billing/manual'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'

export type StaffBillingActionResult = { ok: true; subscriptionId: string } | { ok: false; error: string }

const activationSchema = z.object({
  companyId: z.string().uuid(),
  planKey: z.enum(['employer_premium', 'employer_enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters'),
})

export async function activateCompanyPlan(input: unknown): Promise<StaffBillingActionResult> {
  const staff = await requireStaffShellAccess()
  const parsed = activationSchema.safeParse(input)

  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid activation payload'
    return { ok: false, error: message }
  }

  const { companyId, planKey, billingCycle, reason } = parsed.data

  try {
    const admin = createAdminClient()

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('id, name, name_ar, entity_state')
      .eq('id', companyId)
      .maybeSingle()

    if (companyError) return { ok: false, error: companyError.message }
    if (!company) return { ok: false, error: 'Company not found' }

    const subscriptionId = await activateCompanySubscriptionManual({
      companyId,
      planKey,
      billingCycle,
      activatedBy: staff.id,
      reason,
    })

    const { error: auditError } = await admin.from('audit_logs').insert({
      actor_id: staff.id,
      action: 'company_plan_activated_by_staff',
      entity_type: 'company',
      entity_id: companyId,
      metadata: {
        reason,
        plan_key: planKey,
        billing_cycle: billingCycle,
        subscription_id: subscriptionId,
        source: 'staff_billing',
      } as Json,
    })

    if (auditError) return { ok: false, error: auditError.message }

    revalidatePath('/staff/billing')
    revalidatePath('/billing')

    return { ok: true, subscriptionId }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Activation failed',
    }
  }
}
