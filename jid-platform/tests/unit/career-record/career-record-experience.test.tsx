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

import { CareerRecordView } from '@/features/career-record/components/career-record-view'
import { getCareerRecordCopy } from '@/features/career-record/copy'
import { careerEvidenceDisplay } from '@/features/career-record/fact-display'
import { unavailableCareerRecordPort } from '@/features/career-record/port'
import {
  cvSelectionImpliesPublicVisibility,
  evidenceImpliesRecipientAccess,
  isPrivateByDefault,
  presentEvidencePrivacy,
  verificationImpliesPublicVisibility,
} from '@/features/career-record/privacy'
import { CAREER_RECORD_CORE_OPERATIONS } from '@/features/career-record/operations'
import { makeCareerEvidence, populatedCareerEvidence } from './fixtures'

const ar = getCareerRecordCopy('ar')
const en = getCareerRecordCopy('en')

describe('Career Record presentation — empty and populated', () => {
  it('renders an empty Career Record without invented facts or scores', () => {
    const { container } = render(
      <CareerRecordView state={{ status: 'empty' }} copy={ar} locale="ar" dir="rtl" />,
    )
    expect(screen.getByRole('heading', { name: ar.emptyTitle })).toBeInTheDocument()
    expect(screen.getByText(ar.emptyDescription)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/CV Score|ATS|Completeness %|Match %/i)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('groups populated evidence by supported category', () => {
    render(
      <CareerRecordView
        state={{ status: 'ready', items: populatedCareerEvidence }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    expect(screen.getByRole('heading', { name: ar.category.EDUCATION })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: ar.category.EXPERIENCE })).toBeInTheDocument()
    expect(screen.getByText('جامعة الملك سعود')).toBeInTheDocument()
    expect(screen.getByText('مهندس برمجيات')).toBeInTheDocument()
    expect(screen.getByText(ar.category.SKILL)).toBeInTheDocument()
    expect(screen.getByText(ar.category.PROJECT)).toBeInTheDocument()
    expect(screen.getByText(ar.category.CREDENTIAL)).toBeInTheDocument()
    expect(screen.getByText(ar.category.AWARD)).toBeInTheDocument()
    expect(screen.getByText(ar.category.LANGUAGE)).toBeInTheDocument()
    expect(screen.getByText(ar.category.VOLUNTEERING)).toBeInTheDocument()
    expect(screen.getByText(ar.category.PUBLICATION)).toBeInTheDocument()
    expect(screen.getByText(ar.category.OTHER)).toBeInTheDocument()
  })

  it('does not invent a title when fact payload is empty', () => {
    const evidence = makeCareerEvidence({
      evidence_id: 'blank-1',
      category: 'EXPERIENCE',
      verification_state: 'DECLARED',
      source_class: 'SELF_DECLARED',
      fact_payload: {},
    })
    expect(careerEvidenceDisplay(evidence, 'ar').title).toBeNull()
    render(
      <CareerRecordView
        state={{ status: 'ready', items: [evidence] }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    expect(screen.getByText(ar.untitled)).toBeInTheDocument()
  })
})

describe('Career Record presentation — contract-backed states', () => {
  it('distinguishes declared from verified and shows disputed, revoked, and expired labels', () => {
    render(
      <CareerRecordView
        state={{ status: 'ready', items: populatedCareerEvidence }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    expect(screen.getAllByText(ar.state.DECLARED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.VERIFIED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.DISPUTED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.REVOKED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.EXPIRED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.CONFIRMED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.SOURCED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.DERIVED).length).toBeGreaterThan(0)
  })
})

describe('Career Record presentation — source, privacy, and universal states', () => {
  it('explains source/provenance in the inspector', async () => {
    const user = userEvent.setup()
    render(
      <CareerRecordView
        state={{ status: 'ready', items: populatedCareerEvidence }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    const verifiedItem = screen.getByText('مهندس برمجيات').closest('article')
    expect(verifiedItem).toBeTruthy()
    await user.click(within(verifiedItem as HTMLElement).getByRole('button', { name: ar.inspect }))
    expect(await screen.findByText(ar.sourceIssuer)).toBeInTheDocument()
    expect(screen.getByText(ar.disclosureBody)).toBeInTheDocument()
    expect(screen.getByText(ar.policyPrivate)).toBeInTheDocument()
    expect(screen.getByText(ar.noRecipientGrant)).toBeInTheDocument()
  })

  it('keeps private default and does not treat verification as public or recipient access', () => {
    const verified = populatedCareerEvidence.find((item) => item.verification_state === 'VERIFIED')
    expect(verified).toBeTruthy()
    expect(isPrivateByDefault(verified!)).toBe(true)
    expect(verificationImpliesPublicVisibility(verified!)).toBe(false)
    expect(evidenceImpliesRecipientAccess(verified!)).toBe(false)
    expect(cvSelectionImpliesPublicVisibility(true)).toBe(false)
    expect(
      presentEvidencePrivacy({ selectedInThisCv: true, authorization: null }).sharedWithRecipient,
    ).toBe(false)
  })

  it('renders loading, error, forbidden, unavailable, and stale without hidden fetched data', () => {
    const { rerender } = render(
      <CareerRecordView state={{ status: 'loading' }} copy={ar} locale="ar" dir="rtl" />,
    )
    expect(screen.getByText(ar.loading)).toHaveClass('sr-only')

    rerender(
      <CareerRecordView
        state={{ status: 'error', message: ar.errorMessage }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(ar.errorTitle)

    rerender(<CareerRecordView state={{ status: 'forbidden' }} copy={ar} locale="ar" dir="rtl" />)
    expect(screen.getByText(ar.forbiddenMessage)).toBeInTheDocument()
    expect(screen.queryByText('جامعة الملك سعود')).not.toBeInTheDocument()

    rerender(<CareerRecordView state={{ status: 'unavailable' }} copy={ar} locale="ar" dir="rtl" />)
    expect(screen.getByText(ar.unavailableMessage)).toBeInTheDocument()

    rerender(
      <CareerRecordView
        state={{ status: 'stale', items: populatedCareerEvidence, asOfLabel: '2026-08-01' }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    expect(screen.getByText(ar.staleTitle)).toBeInTheDocument()
    expect(screen.getByText('جامعة الملك سعود')).toBeInTheDocument()
  })
})

describe('Career Record presentation — add, correct, keyboard, AR/EN', () => {
  it('adds declared evidence through the explicit create seam', async () => {
    const user = userEvent.setup()
    const onCreateDeclared = vi.fn()
    render(
      <CareerRecordView
        state={{ status: 'empty' }}
        copy={ar}
        locale="ar"
        dir="rtl"
        onCreateDeclared={onCreateDeclared}
      />,
    )
    await user.click(screen.getAllByRole('button', { name: ar.addEvidence })[0]!)
    expect(await screen.findByRole('heading', { name: ar.addDialogTitle })).toBeInTheDocument()
    await user.type(screen.getByLabelText(ar.fields.company_name), 'شركة جديدة')
    await user.click(screen.getByRole('button', { name: ar.saveDeclared }))
    expect(onCreateDeclared).toHaveBeenCalledWith({
      category: 'EXPERIENCE',
      fact_payload: { company_name: 'شركة جديدة' },
    })
  })

  it('routes fact correction through revise with expected revision, not a silent overwrite', async () => {
    const user = userEvent.setup()
    const onRevise = vi.fn()
    const evidence = makeCareerEvidence({
      evidence_id: 'exp-correct',
      category: 'EXPERIENCE',
      verification_state: 'DECLARED',
      source_class: 'SELF_DECLARED',
      revision_no: 3,
      fact_payload: { company_name: 'جهة سابقة', job_title: 'محلل' },
    })
    render(
      <CareerRecordView
        state={{ status: 'ready', items: [evidence] }}
        copy={ar}
        locale="ar"
        dir="rtl"
        onRevise={onRevise}
      />,
    )
    await user.click(screen.getByRole('button', { name: ar.correctFact }))
    expect(await screen.findByText(ar.correctFactHint)).toBeInTheDocument()
    const company = screen.getByLabelText(ar.fields.company_name)
    await user.clear(company)
    await user.type(company, 'جهة مصححة')
    await user.click(screen.getByRole('button', { name: ar.saveCorrection }))
    expect(onRevise).toHaveBeenCalledWith({
      evidence_id: 'exp-correct',
      expected_revision_no: 3,
      fact_payload: { company_name: 'جهة مصححة', job_title: 'محلل' },
    })
  })

  it('supports keyboard focus on inspect and respects reduced-motion classes', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <CareerRecordView
        state={{ status: 'ready', items: populatedCareerEvidence.slice(0, 1) }}
        copy={en}
        locale="en"
        dir="ltr"
      />,
    )
    expect(container.firstChild).toHaveClass('motion-reduce:animate-none')
    await user.tab()
    const inspect = screen.getByRole('button', { name: en.inspect })
    inspect.focus()
    expect(inspect).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByText(en.sourceSelfDeclared)).toBeInTheDocument()
  })

  it('renders Arabic RTL and English LTR with semantic parity', () => {
    const { rerender } = render(
      <CareerRecordView
        state={{ status: 'ready', items: populatedCareerEvidence }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    expect(screen.getByText(ar.title).closest('[dir="rtl"]')).toHaveAttribute('lang', 'ar')
    expect(screen.getAllByText(ar.state.VERIFIED).length).toBeGreaterThan(0)

    rerender(
      <CareerRecordView
        state={{ status: 'ready', items: populatedCareerEvidence }}
        copy={en}
        locale="en"
        dir="ltr"
      />,
    )
    expect(screen.getByText(en.title).closest('[dir="ltr"]')).toHaveAttribute('lang', 'en')
    expect(screen.getAllByText(en.state.VERIFIED).length).toBeGreaterThan(0)
    expect(en.state.VERIFIED.length).toBeGreaterThan(0)
    expect(ar.state.VERIFIED).not.toEqual(en.state.VERIFIED)
  })
})

describe('Career Record Core port — unavailable default', () => {
  it('does not invent backend operations or successful writes', async () => {
    expect(CAREER_RECORD_CORE_OPERATIONS).toContain('listCareerEvidence')
    expect(unavailableCareerRecordPort.availability).toBe('unavailable')
    await expect(unavailableCareerRecordPort.listCareerEvidence()).resolves.toEqual({
      status: 'unavailable',
    })
    await expect(
      unavailableCareerRecordPort.createDeclaredCareerEvidence({
        category: 'SKILL',
        fact_payload: { name: 'ignored' },
      }),
    ).resolves.toEqual({ status: 'unavailable' })
  })
})
