/**
 * Spec 07-D — Owner publication controls UI.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AnchorHTMLAttributes, ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DraftPublicationBoundary } from '@/components/organization-profile/draft-publication-boundary'
import type { PublicationActionResult } from '@/lib/profile/publication-actions'

const publishOwnedProfileAction = vi.fn()
const unpublishOwnedProfileAction = vi.fn()
const refresh = vi.fn()

vi.mock('@/lib/profile/publication-actions', () => ({
  publishOwnedProfileAction: (...args: unknown[]) => publishOwnedProfileAction(...args),
  unpublishOwnedProfileAction: (...args: unknown[]) => unpublishOwnedProfileAction(...args),
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
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh,
  }),
}))

const PROFILE_ID = '11111111-1111-4111-8111-111111111111'

function renderBoundary(
  overrides: Partial<ComponentProps<typeof DraftPublicationBoundary>> = {},
) {
  return render(
    <DraftPublicationBoundary
      profileId={PROFILE_ID}
      profileType="business"
      status="draft"
      publicSlug="synth-biz"
      editHref="/company/profile/edit"
      {...overrides}
    />,
  )
}

describe('DraftPublicationBoundary — business owner controls', () => {
  beforeEach(() => {
    publishOwnedProfileAction.mockReset()
    unpublishOwnedProfileAction.mockReset()
    refresh.mockReset()
  })

  it('renders draft state with publish control and no completeness metric', () => {
    const { container } = renderBoundary()
    expect(screen.getByText('draftTitle')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'publish' })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/%|completeness|score|progress/i)
  })

  it('requires confirmation before publishing and cancel leaves draft unchanged', async () => {
    renderBoundary()
    fireEvent.click(screen.getByRole('button', { name: 'publish' }))
    expect(screen.getByText('confirmPublishTitle')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    await waitFor(() => {
      expect(screen.queryByText('confirmPublishTitle')).not.toBeInTheDocument()
    })
    expect(publishOwnedProfileAction).not.toHaveBeenCalled()
    expect(screen.getByText('draftTitle')).toBeInTheDocument()
  })

  it('calls publishOwnedProfileAction with type and profile id only', async () => {
    const result: PublicationActionResult = {
      ok: true,
      status: 'published',
      publishedAt: '2026-07-30T12:00:00Z',
    }
    publishOwnedProfileAction.mockResolvedValue(result)

    renderBoundary()
    fireEvent.click(screen.getByRole('button', { name: 'publish' }))
    fireEvent.click(screen.getByRole('button', { name: 'confirmPublish' }))

    await waitFor(() => {
      expect(publishOwnedProfileAction).toHaveBeenCalledTimes(1)
    })
    expect(publishOwnedProfileAction).toHaveBeenCalledWith({
      profileType: 'business',
      profileId: PROFILE_ID,
    })
    const payload = publishOwnedProfileAction.mock.calls[0]?.[0] as Record<string, unknown>
    expect(payload).not.toHaveProperty('owner_user_id')
    expect(payload).not.toHaveProperty('status')

    await waitFor(() => {
      expect(screen.getByText('publishedTitle')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: 'viewPublicProfile' })).toHaveAttribute(
      'href',
      '/companies/synth-biz/profile',
    )
  })

  it('prevents duplicate submit while publish is in flight', async () => {
    let resolveAction = (_value: PublicationActionResult) => {}
    publishOwnedProfileAction.mockImplementation(
      () =>
        new Promise<PublicationActionResult>((resolve) => {
          resolveAction = resolve
        }),
    )

    renderBoundary()
    fireEvent.click(screen.getByRole('button', { name: 'publish' }))
    fireEvent.click(screen.getByRole('button', { name: 'confirmPublish' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'publishing' })).toBeDisabled()
    })
    fireEvent.click(screen.getByRole('button', { name: 'publishing' }))
    expect(publishOwnedProfileAction).toHaveBeenCalledTimes(1)

    resolveAction({ ok: true, status: 'published', publishedAt: null })
    await waitFor(() => {
      expect(screen.getByText('publishedTitle')).toBeInTheDocument()
    })
  })

  it('lists exactly display_name_ar and about_ar when both are missing', async () => {
    publishOwnedProfileAction.mockResolvedValue({
      ok: false,
      error: 'missing_display_name_ar_and_about_ar',
    })

    renderBoundary()
    fireEvent.click(screen.getByRole('button', { name: 'publish' }))
    fireEvent.click(screen.getByRole('button', { name: 'confirmPublish' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByText('missingFields.display_name_ar')).toBeInTheDocument()
    expect(screen.getByText('missingFields.about_ar')).toBeInTheDocument()
    const editLinks = screen.getAllByRole('link', { name: 'editProfile' })
    expect(editLinks.length).toBeGreaterThan(0)
    expect(editLinks[0]).toHaveAttribute('href', '/company/profile/edit')
  })

  it('renders missing about_ar alone without inventing a third requirement', async () => {
    publishOwnedProfileAction.mockResolvedValue({
      ok: false,
      error: 'missing_about_ar',
    })

    renderBoundary()
    fireEvent.click(screen.getByRole('button', { name: 'publish' }))
    fireEvent.click(screen.getByRole('button', { name: 'confirmPublish' }))

    await waitFor(() => {
      expect(screen.getByText('missingFields.about_ar')).toBeInTheDocument()
    })
    expect(screen.queryByText('missingFields.display_name_ar')).not.toBeInTheDocument()
  })

  it('published state requires unpublish confirmation then returns to draft', async () => {
    unpublishOwnedProfileAction.mockResolvedValue({
      ok: true,
      status: 'draft',
      publishedAt: null,
    })

    renderBoundary({ status: 'published' })
    expect(screen.getByRole('button', { name: 'unpublish' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'unpublish' }))
    expect(screen.getByText('confirmUnpublishTitle')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'confirmUnpublish' }))

    await waitFor(() => {
      expect(unpublishOwnedProfileAction).toHaveBeenCalledWith({
        profileType: 'business',
        profileId: PROFILE_ID,
      })
    })
    await waitFor(() => {
      expect(screen.getByText('draftTitle')).toBeInTheDocument()
    })
    expect(screen.queryByRole('link', { name: 'viewPublicProfile' })).not.toBeInTheDocument()
  })

  it('suspended state omits publication controls with honest copy', () => {
    renderBoundary({ status: 'suspended' })
    expect(screen.getByText('suspendedTitle')).toBeInTheDocument()
    expect(screen.getByText('suspendedBody')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'publish' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'unpublish' })).not.toBeInTheDocument()
  })

  it('announces state changes with role=status', async () => {
    publishOwnedProfileAction.mockResolvedValue({
      ok: true,
      status: 'published',
      publishedAt: null,
    })
    renderBoundary()
    fireEvent.click(screen.getByRole('button', { name: 'publish' }))
    fireEvent.click(screen.getByRole('button', { name: 'confirmPublish' }))
    await waitFor(() => {
      expect(screen.getByText('announcePublished')).toBeInTheDocument()
    })
    expect(screen.getByText('announcePublished').closest('[role="status"]')).toBeTruthy()
  })
})

describe('DraftPublicationBoundary — university owner controls', () => {
  beforeEach(() => {
    publishOwnedProfileAction.mockReset()
    unpublishOwnedProfileAction.mockReset()
  })

  it('mirrors business publish payload and public university href', async () => {
    publishOwnedProfileAction.mockResolvedValue({
      ok: true,
      status: 'published',
      publishedAt: null,
    })

    renderBoundary({
      profileType: 'university',
      publicSlug: 'synth-uni',
      editHref: '/university/profile/edit',
    })
    fireEvent.click(screen.getByRole('button', { name: 'publish' }))
    fireEvent.click(screen.getByRole('button', { name: 'confirmPublish' }))

    await waitFor(() => {
      expect(publishOwnedProfileAction).toHaveBeenCalledWith({
        profileType: 'university',
        profileId: PROFILE_ID,
      })
    })
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'viewPublicProfile' })).toHaveAttribute(
        'href',
        '/universities/synth-uni/profile',
      )
    })
  })

  it('omits controls when university profile is suspended', () => {
    renderBoundary({
      profileType: 'university',
      status: 'suspended',
      editHref: '/university/profile/edit',
    })
    expect(screen.queryByRole('button', { name: 'publish' })).not.toBeInTheDocument()
    expect(screen.getByText('suspendedBody')).toBeInTheDocument()
  })
})
