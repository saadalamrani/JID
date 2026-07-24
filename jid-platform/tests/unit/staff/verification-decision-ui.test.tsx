/**
 * PSW-002 — Staff Verification Decision Experience.
 *
 * Component-level proof for the two requirements that are easiest to get
 * wrong silently: (a) Business vs. University requests must render with a
 * visibly distinct badge, and (b) a self-review request must render its
 * decision controls as genuinely non-interactive (disabled), not merely
 * hidden behind client-side logic that a user could bypass.
 *
 * next-intl's `useTranslations` is mocked globally (tests/setup.ts) to echo
 * the key back — so these assertions target DOM structure/attributes, not
 * literal translated copy (copy correctness is covered separately in
 * verification-copy.test.ts, which reads the message JSON directly).
 */
import { render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { VerificationCard } from '@/app/[locale]/(staff)/staff/verification/_components/verification-card'
import { VerificationDecisionForm } from '@/app/[locale]/(staff)/staff/verification/[id]/_components/verification-decision-form'
import type { StaffClaimsQueueItem } from '@/lib/staff/claims-queue'

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
    id: 'vr-1',
    queueType: 'business',
    applicantName: 'Test Applicant',
    targetEntityName: 'Test Org',
    submittedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    assignedStaffId: null,
    status: 'pending',
    href: '/staff/verification/vr-1',
    ...overrides,
  }
}

describe('3. Business and University requests render with distinct badges', () => {
  it('a business item gets the business badge class, not the university one', () => {
    render(<VerificationCard item={makeItem({ queueType: 'business' })} />)
    const badge = screen.getByText('type.business')
    expect(badge.className).toMatch(/bg-primary\/10/)
  })

  it('a university item gets the university badge class, distinct from business', () => {
    render(<VerificationCard item={makeItem({ queueType: 'university', id: 'vr-2' })} />)
    const badge = screen.getByText('type.university')
    expect(badge.className).toMatch(/bg-blue-100/)
    expect(badge.className).not.toMatch(/bg-primary\/10/)
  })
})

describe('7. Self-review controls render as genuinely disabled, not just logically blocked', () => {
  const baseValue = { decision: 'rejected' as const, reason: '', requiredDocuments: [] }

  it('disables every decision radio, the reason field, document checkboxes and submit when isSelfReview', () => {
    render(
      <VerificationDecisionForm
        value={baseValue}
        onChange={() => {}}
        checklistComplete
        isSelfReview
        submitting={false}
        onSubmit={() => {}}
      />,
    )

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeDisabled()
    }
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })

  it('does not disable controls for a non-self-review request', () => {
    render(
      <VerificationDecisionForm
        value={baseValue}
        onChange={() => {}}
        checklistComplete
        isSelfReview={false}
        submitting={false}
        onSubmit={() => {}}
      />,
    )

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toBeDisabled()
    }
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })
})

describe('6/9. Approve is blocked client-side until the checklist is complete', () => {
  it('disables submit when decision=approved and checklistComplete=false', () => {
    render(
      <VerificationDecisionForm
        value={{ decision: 'approved', reason: 'A sufficiently long reason here.', requiredDocuments: [] }}
        onChange={() => {}}
        checklistComplete={false}
        isSelfReview={false}
        submitting={false}
        onSubmit={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })

  it('enables submit when decision=approved, checklist complete and reason is long enough', () => {
    render(
      <VerificationDecisionForm
        value={{ decision: 'approved', reason: 'A sufficiently long reason here.', requiredDocuments: [] }}
        onChange={() => {}}
        checklistComplete
        isSelfReview={false}
        submitting={false}
        onSubmit={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
  })
})
