import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: navigation.push }),
}))

import { CvProjectionRoute } from '@/features/cv-projection/cv-projection-route'
import { getCvProjectionCopy } from '@/features/cv-projection/copy'
import { unavailableCvProjectionPort } from '@/features/cv-projection'
import { makeCareerEvidence } from '../career-record/fixtures'
import { makeCvProjection } from './fixtures'
import { createCvProjectionTestPort } from './test-port'

const ar = getCvProjectionCopy('ar')

function projectionWithTwoExperienceItems() {
  const evidence = [
    makeCareerEvidence({
      evidence_id: 'exp-a',
      category: 'EXPERIENCE',
      verification_state: 'DECLARED',
      source_class: 'SELF_DECLARED',
      fact_payload: { company_name: 'جهة أولى', job_title: 'محلل' },
    }),
    makeCareerEvidence({
      evidence_id: 'exp-b',
      category: 'EXPERIENCE',
      verification_state: 'DECLARED',
      source_class: 'SELF_DECLARED',
      fact_payload: { company_name: 'جهة ثانية', job_title: 'مهندس' },
    }),
  ]
  return makeCvProjection({
    evidence,
    items: evidence.map((item, index) => ({
      evidence_id: item.evidence_id,
      section_key: 'EXPERIENCE' as const,
      sort_order: index,
      is_selected: true,
      presentation_payload: {},
    })),
  })
}

describe('CV projection journey harness — injected port', () => {
  it('creates and manages a projection title through the injected port', async () => {
    const user = userEvent.setup()
    render(
      <CvProjectionRoute
        port={createCvProjectionTestPort({
          projection: makeCvProjection({ title: 'سيرة أولية', evidence: [], items: [] }),
        })}
      />,
    )
    const title = await screen.findByLabelText(ar.cvTitle)
    expect(title).toHaveValue('سيرة أولية')
    await user.clear(title)
    await user.type(title, 'سيرة محدّثة')
    await user.tab()
    await screen.findByDisplayValue('سيرة محدّثة')
  })

  it('selects and deselects evidence without treating selection as a share', async () => {
    const user = userEvent.setup()
    const evidence = [
      makeCareerEvidence({
        evidence_id: 'skill-select',
        category: 'SKILL',
        verification_state: 'DECLARED',
        source_class: 'SELF_DECLARED',
        fact_payload: { name: 'SQL' },
      }),
    ]
    render(
      <CvProjectionRoute
        port={createCvProjectionTestPort({
          projection: makeCvProjection({ evidence, items: [] }),
          shareMode: 'private',
        })}
      />,
    )
    await user.click(await screen.findByRole('button', { name: ar.include }))
    expect(await screen.findByRole('button', { name: ar.exclude })).toBeInTheDocument()
    expect(screen.getAllByText(ar.sharePrivate).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: ar.exclude }))
    expect(await screen.findByRole('button', { name: ar.include })).toBeInTheDocument()
  })

  it('reorders sections and items through the injected port', async () => {
    const user = userEvent.setup()
    render(
      <CvProjectionRoute
        port={createCvProjectionTestPort({ projection: projectionWithTwoExperienceItems() })}
      />,
    )
    expect((await screen.findAllByText('مهندس')).length).toBeGreaterThan(0)
    const sectionList = screen.getByRole('heading', { name: ar.sectionOrder }).closest('section')
    expect(sectionList).toBeTruthy()
    await user.click(
      within(sectionList as HTMLElement).getAllByRole('button', { name: ar.moveDown })[0]!,
    )
    const selection = screen.getByRole('heading', { name: ar.inThisCv }).closest('section')
    expect(selection).toBeTruthy()
    const firstItem = within(selection as HTMLElement).getByText('محلل').closest('li')
    expect(firstItem).toBeTruthy()
    await user.click(within(firstItem as HTMLElement).getByRole('button', { name: ar.moveDown }))
    expect(within(selection as HTMLElement).getByText('مهندس')).toBeInTheDocument()
  })

  it('saves CV-only presentation text, routes fact edit to Career Record, and shows preview', async () => {
    const user = userEvent.setup()
    navigation.push.mockClear()
    const evidence = [
      makeCareerEvidence({
        evidence_id: 'exp-word',
        category: 'EXPERIENCE',
        verification_state: 'DECLARED',
        source_class: 'SELF_DECLARED',
        fact_payload: { company_name: 'جهة العمل', job_title: 'محلل بيانات' },
      }),
    ]
    render(
      <CvProjectionRoute
        port={createCvProjectionTestPort({
          projection: makeCvProjection({
            title: 'سيرة للمعاينة',
            evidence,
            items: [
              {
                evidence_id: 'exp-word',
                section_key: 'EXPERIENCE',
                sort_order: 0,
                is_selected: true,
                presentation_payload: {},
              },
            ],
          }),
        })}
      />,
    )
    expect(await screen.findByText('محلل بيانات')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: ar.presentationWording }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    const displayTitle = screen.getByLabelText(ar.displayTitle)
    await user.clear(displayTitle)
    await user.type(displayTitle, 'صياغة للسيرة فقط')
    await user.click(screen.getByRole('button', { name: ar.savePresentation }))
    expect((await screen.findAllByText('صياغة للسيرة فقط')).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: ar.preview })).toBeInTheDocument()
    expect(screen.getByText('سيرة للمعاينة')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: ar.correctFact }))
    expect(navigation.push).toHaveBeenCalledWith('/profile/career-record')
  })

  it('fails recipient share when authorization is unavailable', async () => {
    const user = userEvent.setup()
    render(
      <CvProjectionRoute
        port={createCvProjectionTestPort({
          projection: makeCvProjection(),
          shareMode: 'unavailable',
        })}
      />,
    )
    await screen.findByRole('button', { name: ar.requestShare })
    await user.click(screen.getByRole('button', { name: ar.requestShare }))
    expect(await screen.findByText(ar.shareUnavailable)).toBeInTheDocument()
    expect(screen.queryByText(ar.shareAuthorized)).not.toBeInTheDocument()
  })

  it('shows successful share UI only when the test port returns an authorized result', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <CvProjectionRoute
        port={createCvProjectionTestPort({
          projection: makeCvProjection(),
          shareMode: 'private',
        })}
      />,
    )
    await user.click(await screen.findByRole('button', { name: ar.requestShare }))
    expect(await screen.findByText(ar.shareUnavailable)).toBeInTheDocument()
    expect(screen.queryByText(ar.shareAuthorized)).not.toBeInTheDocument()

    rerender(
      <CvProjectionRoute
        port={createCvProjectionTestPort({
          projection: makeCvProjection({
            share: {
              kind: 'authorized',
              purpose: 'PUBLIC_SHARE',
              recipient_label: 'جهة مستلمة مصرّح بها',
              authorization_ref: { id: 'authz-test' },
            },
          }),
          shareMode: 'authorized',
        })}
      />,
    )
    expect(await screen.findByText(ar.shareAuthorized)).toBeInTheDocument()
    expect(screen.getByText(/جهة مستلمة مصرّح بها/)).toBeInTheDocument()
  })

  it('keeps the production default port honest and unavailable', async () => {
    render(<CvProjectionRoute />)
    expect(await screen.findByText(ar.unavailableMessage)).toBeInTheDocument()
    expect(unavailableCvProjectionPort.availability).toBe('unavailable')
    await expect(unavailableCvProjectionPort.previewCvProjection('cv-1')).resolves.toEqual({
      status: 'unavailable',
    })
    await expect(
      unavailableCvProjectionPort.createCvSnapshot({ cv_id: 'cv-1', purpose: 'PUBLIC_SHARE' }),
    ).resolves.toEqual({ status: 'unavailable' })
  })
})
