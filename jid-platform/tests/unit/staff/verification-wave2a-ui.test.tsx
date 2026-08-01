/**
 * Spec 08-C — Wave 2A staff verification visual + locale honesty.
 * Does not weaken Spec 02 assignment / self-review / override contracts.
 */
import { render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { VerificationCard } from '@/app/[locale]/(staff)/staff/verification/_components/verification-card'
import { VerificationDecisionForm } from '@/app/[locale]/(staff)/staff/verification/[id]/_components/verification-decision-form'
import { RelatedHistoryPanel } from '@/app/[locale]/(staff)/staff/verification/[id]/_components/related-history-panel'
import { URGENCY_BORDER_CLASS } from '@/lib/staff/verification-urgency'
import type { StaffClaimsQueueItem } from '@/lib/staff/claims-queue'
import en from '@/../messages/en.json'
import ar from '@/../messages/ar.json'

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

function makeItem(overrides: Partial<StaffClaimsQueueItem> = {}): StaffClaimsQueueItem {
  return {
    id: 'vr-wave2a',
    queueType: 'business',
    applicantName: 'Synth Applicant',
    targetEntityName: 'Synth Org',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    slaDueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    assignedStaffId: null,
    status: 'pending',
    href: '/staff/verification/vr-wave2a',
    ...overrides,
  }
}

describe('Wave 2A verification visual honesty', () => {
  it('uses restrained overdue rail and no purple mentor badge', () => {
    expect(URGENCY_BORDER_CLASS.overdue).toMatch(/destructive/)
    expect(URGENCY_BORDER_CLASS.critical).toMatch(/jid-gold/)
    render(<VerificationCard item={makeItem({ queueType: 'mentor' })} />)
    const badge = screen.getByText('type.mentor')
    expect(badge.className).not.toMatch(/purple/)
    expect(badge.className).toMatch(/jid-olive/)
  })

  it('keeps Spec 02 university badge class while Wave 2A restyles mentor/business', () => {
    render(<VerificationCard item={makeItem({ queueType: 'university' })} />)
    expect(screen.getByText('type.university').className).toMatch(/bg-blue-100/)
  })

  it('decision submit uses olive brand class (not generic SaaS purple)', () => {
    render(
      <VerificationDecisionForm
        value={{
          decision: 'rejected',
          reason: '1234567890',
          requiredDocuments: ['commercial_registry'],
        }}
        onChange={() => {}}
        checklistComplete
        isSelfReview={false}
        submitting={false}
        onSubmit={() => {}}
      />,
    )
    const submit = screen.getByRole('button', { name: 'submit' })
    expect(submit.className).toMatch(/jid-olive/)
  })

  it('related history renders a Latin-digit timestamp', () => {
    render(
      <RelatedHistoryPanel
        items={[
          {
            id: 'h1',
            company_name: 'Synth Co',
            verification_type: 'business',
            status: 'rejected',
            relation: 'same_user',
            created_at: '2026-01-15T10:00:00.000Z',
            reviewed_at: '2026-01-16T10:00:00.000Z',
          },
        ]}
      />,
    )
    const stamp = screen.getByText(/2026/)
    expect(stamp.textContent).toMatch(/[0-9]/)
    expect(stamp.textContent).not.toMatch(/[٠-٩]/)
  })
})

describe('Wave 2A deferred capability copy parity', () => {
  it('AR/EN deferred keys match without Claim terminology', () => {
    const enDef = en.staff.verificationReview.workspace.deferred
    const arDef = ar.staff.verificationReview.workspace.deferred
    expect(Object.keys(enDef).sort()).toEqual(Object.keys(arDef).sort())
    expect(JSON.stringify(enDef).toLowerCase()).not.toMatch(/claim/)
    expect(JSON.stringify(arDef)).not.toMatch(/مطالبة/)
  })
})
