import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AutomationReviewCallout } from '@/components/ui/automation-review-callout'
import { SHARED_CONTRACT_VERSION, type AutomationAuthority } from '@/types/contracts'

const labels = {
  explanation: 'Draft is sourced from the listed evidence and still needs human review.',
  reviewLabel: 'Review',
  outputLabel: 'Output',
  confirmationRefLabel: 'Confirmation',
  confirmationLabel: 'Confirm external action',
}

describe('AutomationReviewCallout', () => {
  it('does not offer confirmation for non-consequential assistance', () => {
    const authority = {
      contract_version: SHARED_CONTRACT_VERSION,
      automation_id: 'a1',
      requesting_actor_ref: { id: 'u1' },
      purpose_code: 'draft-summary',
      input_data_classes: ['PUBLIC_PROFILE'],
      permitted_output_class: 'SUMMARIZE',
      source_evidence_refs: [{ id: 'ev1' }],
      fallback_state: 'NO_ACTION',
      kill_state: 'ENABLED',
      audit_ref: { id: 'audit-1' },
      permitted_action_class: 'NONE',
      human_review_state: 'NOT_REQUIRED',
      consequential_external_action: false,
    } satisfies AutomationAuthority

    render(<AutomationReviewCallout authority={authority} {...labels} />)
    expect(screen.getByText(labels.explanation)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: labels.confirmationLabel })).not.toBeInTheDocument()
  })

  it('requires approved human review and an explicit confirmation ref before enabling action', () => {
    const authority = {
      contract_version: SHARED_CONTRACT_VERSION,
      automation_id: 'a2',
      requesting_actor_ref: { id: 'u1' },
      purpose_code: 'send-message',
      input_data_classes: ['APPLICATION'],
      permitted_output_class: 'PREPARE',
      source_evidence_refs: [{ id: 'ev1' }],
      fallback_state: 'FAIL_CLOSED',
      kill_state: 'ENABLED',
      audit_ref: { id: 'audit-2' },
      permitted_action_class: 'CONSEQUENTIAL_EXTERNAL_ACTION_AFTER_CONFIRMATION',
      human_review_state: 'APPROVED',
      consequential_external_action: true,
      external_confirmation_ref: { id: 'confirm-9' },
    } satisfies AutomationAuthority

    render(
      <AutomationReviewCallout authority={authority} onConfirm={() => undefined} {...labels} />,
    )
    expect(screen.getByText('confirm-9')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: labels.confirmationLabel })).toBeEnabled()
  })
})
