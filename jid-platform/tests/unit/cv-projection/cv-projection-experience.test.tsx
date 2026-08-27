import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}))

import { CvProjectionView } from '@/features/cv-projection/components/cv-projection-view'
import { getCvProjectionCopy } from '@/features/cv-projection/copy'
import { unavailableCvProjectionPort } from '@/features/cv-projection/port'
import {
  presentationPayloadHasForbiddenFactKeys,
  sanitizePresentationPayload,
} from '@/features/cv-projection/presentation-guard'
import { CV_PROJECTION_CORE_OPERATIONS } from '@/features/cv-projection/operations'
import { makeCvProjection } from './fixtures'
import { makeCareerEvidence } from '../career-record/fixtures'

const ar = getCvProjectionCopy('ar')
const en = getCvProjectionCopy('en')

describe('CV projection — selection, order, and presentation', () => {
  it('includes and excludes evidence without mutating Career Record facts', async () => {
    const user = userEvent.setup()
    const evidence = [
      makeCareerEvidence({
        evidence_id: 'exp-keep',
        category: 'EXPERIENCE',
        verification_state: 'DECLARED',
        source_class: 'SELF_DECLARED',
        fact_payload: { company_name: 'جهة العمل', job_title: 'محلل بيانات' },
      }),
    ]
    const originalFacts = JSON.stringify(evidence[0]!.fact_payload)
    const onSetSelection = vi.fn()
    render(
      <CvProjectionView
        state={{ status: 'ready', projection: makeCvProjection({ evidence, items: [] }) }}
        copy={ar}
        locale="ar"
        dir="rtl"
        onSetSelection={onSetSelection}
      />,
    )

    await user.click(screen.getByRole('button', { name: ar.include }))
    expect(onSetSelection).toHaveBeenCalledWith('EXPERIENCE', ['exp-keep'])
    expect(JSON.stringify(evidence[0]!.fact_payload)).toBe(originalFacts)

    await user.click(screen.getByRole('button', { name: ar.exclude }))
    expect(onSetSelection).toHaveBeenLastCalledWith('EXPERIENCE', [])
    expect(JSON.stringify(evidence[0]!.fact_payload)).toBe(originalFacts)
  })

  it('reorders sections and items through presentation intents', async () => {
    const user = userEvent.setup()
    const onUpdatePresentation = vi.fn()
    const onSetSelection = vi.fn()
    const projection = makeCvProjection()
    render(
      <CvProjectionView
        state={{ status: 'ready', projection }}
        copy={ar}
        locale="ar"
        dir="rtl"
        onUpdatePresentation={onUpdatePresentation}
        onSetSelection={onSetSelection}
      />,
    )

    const sectionList = screen.getByRole('heading', { name: ar.sectionOrder }).closest('section')
    expect(sectionList).toBeTruthy()
    const firstMoveDown = within(sectionList as HTMLElement).getAllByRole('button', {
      name: ar.moveDown,
    })[0]!
    await user.click(firstMoveDown)
    expect(onUpdatePresentation).toHaveBeenCalledWith(
      expect.objectContaining({ section_order: expect.any(Array) }),
    )
  })

  it('keeps presentation wording off the fact payload and routes fact-edit to the Career Record seam', async () => {
    const user = userEvent.setup()
    const evidence = [
      makeCareerEvidence({
        evidence_id: 'exp-word',
        category: 'EXPERIENCE',
        verification_state: 'DECLARED',
        source_class: 'SELF_DECLARED',
        fact_payload: { company_name: 'جهة العمل', job_title: 'محلل بيانات' },
      }),
    ]
    const originalFacts = JSON.stringify(evidence[0]!.fact_payload)
    const onUpdatePresentation = vi.fn()
    const onRequestFactCorrection = vi.fn()
    render(
      <CvProjectionView
        state={{
          status: 'ready',
          projection: makeCvProjection({
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
        }}
        copy={ar}
        locale="ar"
        dir="rtl"
        onUpdatePresentation={onUpdatePresentation}
        onRequestFactCorrection={onRequestFactCorrection}
      />,
    )

    await user.click(screen.getByRole('button', { name: ar.presentationWording }))
    const title = await screen.findByLabelText(ar.displayTitle)
    await user.clear(title)
    await user.type(title, 'صياغة للسيرة فقط')
    await user.click(screen.getByRole('button', { name: ar.savePresentation }))
    expect(onUpdatePresentation).toHaveBeenCalledWith({
      item_presentation: {
        evidence_id: 'exp-word',
        presentation_payload: { display_title: 'صياغة للسيرة فقط' },
      },
    })
    expect(JSON.stringify(evidence[0]!.fact_payload)).toBe(originalFacts)
    expect(evidence[0]!.fact_payload.job_title).toBe('محلل بيانات')

    await user.click(screen.getByRole('button', { name: ar.correctFact }))
    expect(onRequestFactCorrection).toHaveBeenCalledWith('exp-word')
  })
})

describe('CV projection — privacy, share, and states', () => {
  it('defaults to private and does not fabricate a successful share', async () => {
    const user = userEvent.setup()
    const onRequestShare = vi.fn()
    render(
      <CvProjectionView
        state={{ status: 'ready', projection: makeCvProjection() }}
        copy={ar}
        locale="ar"
        dir="rtl"
        onRequestShare={onRequestShare}
        shareMessage={ar.shareUnavailable}
      />,
    )
    expect(screen.getAllByText(ar.sharePrivate).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.inRecord).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.inThisCv).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.sharedWithRecipient, { exact: false }).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: ar.requestShare }))
    expect(onRequestShare).toHaveBeenCalledTimes(1)
    expect(screen.getByText(ar.shareUnavailable)).toBeInTheDocument()
    expect(screen.queryByText(ar.shareAuthorized)).not.toBeInTheDocument()
  })

  it('renders unavailable, error, forbidden, stale, empty, and English LTR', () => {
    const { rerender } = render(
      <CvProjectionView state={{ status: 'unavailable' }} copy={ar} locale="ar" dir="rtl" />,
    )
    expect(screen.getByText(ar.unavailableMessage)).toBeInTheDocument()

    rerender(
      <CvProjectionView
        state={{ status: 'error', message: ar.errorMessage }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(ar.errorTitle)

    rerender(<CvProjectionView state={{ status: 'forbidden' }} copy={en} locale="en" dir="ltr" />)
    expect(screen.getByText(en.forbiddenMessage)).toBeInTheDocument()
    expect(screen.getByText(en.forbiddenTitle).closest('[dir="ltr"]')).toHaveAttribute('lang', 'en')

    rerender(
      <CvProjectionView
        state={{ status: 'stale', projection: makeCvProjection(), asOfLabel: '2026-08-01' }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    expect(screen.getByText(ar.staleTitle)).toBeInTheDocument()

    rerender(<CvProjectionView state={{ status: 'empty' }} copy={ar} locale="ar" dir="rtl" />)
    expect(screen.getByText(ar.emptyTitle)).toBeInTheDocument()
  })

  it('keeps keyboard-accessible include controls with visible labels', async () => {
    const user = userEvent.setup()
    render(
      <CvProjectionView
        state={{
          status: 'ready',
          projection: makeCvProjection({
            evidence: [
              makeCareerEvidence({
                evidence_id: 'skill-k',
                category: 'SKILL',
                verification_state: 'DECLARED',
                source_class: 'SELF_DECLARED',
                fact_payload: { name: 'SQL' },
              }),
            ],
            items: [],
          }),
        }}
        copy={en}
        locale="en"
        dir="ltr"
      />,
    )
    const include = screen.getByRole('button', { name: en.include })
    include.focus()
    expect(include).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: en.exclude })).toBeInTheDocument()
  })
})

describe('CV presentation guard', () => {
  it('strips canonical fact keys from presentation payloads', () => {
    expect(
      presentationPayloadHasForbiddenFactKeys({
        display_title: 'Shown',
        job_title: 'Should not travel',
      }),
    ).toBe(true)
    expect(
      sanitizePresentationPayload({
        display_title: 'Shown',
        job_title: 'Should not travel',
        summary: 'CV wording',
      }),
    ).toEqual({ display_title: 'Shown', summary: 'CV wording' })
  })
})

describe('CV projection Core port — unavailable default', () => {
  it('does not fabricate snapshots or share success', async () => {
    expect(CV_PROJECTION_CORE_OPERATIONS).toContain('createCvSnapshot')
    expect(unavailableCvProjectionPort.availability).toBe('unavailable')
    await expect(unavailableCvProjectionPort.getCvProjection()).resolves.toEqual({
      status: 'unavailable',
    })
    await expect(
      unavailableCvProjectionPort.createCvSnapshot({ cv_id: 'cv-1', purpose: 'PUBLIC_SHARE' }),
    ).resolves.toEqual({ status: 'unavailable' })
  })
})
