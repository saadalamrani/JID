/**
 * Spec 02-C — workspace assignment UI states (view-only banner vs override form).
 */
import { render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VerificationReviewWorkspace } from '@/app/[locale]/(staff)/staff/verification/[id]/_components/verification-review-workspace'
import type { VerificationReviewWorkspaceData } from '@/lib/staff/verification-review-queries'

const mutate = vi.fn()
const push = vi.fn()
const refresh = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useMutation: (opts: { mutationFn: () => Promise<void> }) => ({
    mutate: () => {
      mutate()
      void opts.mutationFn()
    },
    isPending: false,
  }),
}))

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
  useRouter: () => ({ push, refresh }),
}))

vi.mock('@/app/[locale]/(staff)/staff/verification/actions', () => ({
  reviewVerification: vi.fn(async () => ({ ok: true })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeData(
  overrides: {
    verification?: Partial<VerificationReviewWorkspaceData['verification']>
    directory?: VerificationReviewWorkspaceData['directory']
    applicant?: VerificationReviewWorkspaceData['applicant']
    relatedHistory?: VerificationReviewWorkspaceData['relatedHistory']
    currentUserId?: string
    viewerRole?: VerificationReviewWorkspaceData['viewerRole']
    isSelfReview?: boolean
  } = {},
): VerificationReviewWorkspaceData {
  const { verification: verificationOverrides, ...rest } = overrides
  return {
    verification: {
      id: '11111111-1111-1111-1111-111111111111',
      applicant_user_id: 'applicant-1',
      directory_id: 'dir-1',
      company_name: 'Acme',
      business_email: 'rep@acme.test',
      claimant_name: 'Rep',
      claimant_title: 'CEO',
      status: 'pending_review',
      verification_type: 'business',
      created_at: new Date().toISOString(),
      reviewed_at: null,
      review_notes: null,
      rejection_reason: null,
      required_documents: [],
      assigned_staff_id: 'other-staff',
      sla_due_at: null,
      ...verificationOverrides,
    },
    directory: null,
    applicant: null,
    relatedHistory: [],
    currentUserId: 'viewer-1',
    viewerRole: 'staff',
    isSelfReview: false,
    ...rest,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Spec 02-C workspace assignment UI', () => {
  it('shows view-only banner and no decision controls for staff viewing another assignee', () => {
    render(<VerificationReviewWorkspace data={makeData({ viewerRole: 'staff' })} />)

    expect(screen.getByTestId('assigned-to-other-banner')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit/i })).toBeNull()
    expect(screen.queryByTestId('assignment-override-checkbox')).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
  })

  it('shows override checkbox only for super_admin on another assignee, never for staff', () => {
    const { rerender } = render(
      <VerificationReviewWorkspace data={makeData({ viewerRole: 'super_admin' })} />,
    )
    expect(screen.getByTestId('assignment-override-checkbox')).toBeInTheDocument()
    expect(screen.getByTestId('assignment-override-checkbox')).not.toBeChecked()
    expect(screen.queryByTestId('assigned-to-other-banner')).toBeNull()

    rerender(<VerificationReviewWorkspace data={makeData({ viewerRole: 'staff' })} />)
    expect(screen.queryByTestId('assignment-override-checkbox')).toBeNull()
    expect(screen.getByTestId('assigned-to-other-banner')).toBeInTheDocument()
  })

  it('self-review for super_admin takes precedence over override/view-only states', () => {
    render(
      <VerificationReviewWorkspace
        data={makeData({
          viewerRole: 'super_admin',
          currentUserId: 'super-1',
          isSelfReview: true,
          verification: {
            applicant_user_id: 'super-1',
            assigned_staff_id: 'other-staff',
          },
        })}
      />,
    )

    expect(screen.queryByTestId('assigned-to-other-banner')).toBeNull()
    expect(screen.queryByTestId('assignment-override-checkbox')).toBeNull()
    expect(screen.getByText('selfReviewBlocked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })
})
