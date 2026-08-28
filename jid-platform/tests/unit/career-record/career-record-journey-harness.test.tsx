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

import { CareerRecordRoute } from '@/features/career-record/career-record-route'
import { getCareerRecordCopy } from '@/features/career-record/copy'
import {
  CAREER_RECORD_CORE_OPERATIONS,
  boundCareerRecordPort,
  unavailableCareerRecordPort,
} from '@/features/career-record'
import { makeCareerEvidence, populatedCareerEvidence } from './fixtures'
import { createCareerRecordTestPort, createDeferred } from './test-port'
import type { CoreResult } from '@/features/career-record/operations'
import type { CareerEvidence } from '@/types/contracts'

const ar = getCareerRecordCopy('ar')

describe('Career Record journey harness — injected port', () => {
  it('shows loading until the injected port resolves', async () => {
    const deferred = createDeferred<CoreResult<readonly CareerEvidence[]>>()
    render(
      <CareerRecordRoute
        port={createCareerRecordTestPort({ list: { kind: 'hang', promise: deferred.promise } })}
      />,
    )
    expect(screen.getByText(ar.loading)).toHaveClass('sr-only')
    deferred.resolve({ status: 'ok', data: [] })
    expect(await screen.findByRole('heading', { name: ar.emptyTitle })).toBeInTheDocument()
  })

  it('renders empty, populated, declared vs verified, disputed, revoked, expired, and private default', async () => {
    const { rerender } = render(
      <CareerRecordRoute port={createCareerRecordTestPort({ items: [] })} />,
    )
    expect(await screen.findByRole('heading', { name: ar.emptyTitle })).toBeInTheDocument()

    rerender(
      <CareerRecordRoute port={createCareerRecordTestPort({ items: populatedCareerEvidence })} />,
    )
    expect(await screen.findByText('جامعة الملك سعود')).toBeInTheDocument()
    expect(screen.getAllByText(ar.state.DECLARED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.VERIFIED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.DISPUTED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.REVOKED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.state.EXPIRED).length).toBeGreaterThan(0)
    expect(screen.getAllByText(ar.privateNotice).length).toBeGreaterThan(0)
  })

  it('adds declared evidence through the injected port', async () => {
    const user = userEvent.setup()
    render(<CareerRecordRoute port={createCareerRecordTestPort({ items: [] })} />)
    await screen.findByRole('heading', { name: ar.emptyTitle })
    await user.click(screen.getAllByRole('button', { name: ar.addEvidence })[0]!)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.type(screen.getByLabelText(ar.fields.company_name), 'شركة اختبار')
    await user.click(screen.getByRole('button', { name: ar.saveDeclared }))
    expect(await screen.findByText('شركة اختبار')).toBeInTheDocument()
  })

  it('inspects evidence in a sheet and revises through expected revision', async () => {
    const user = userEvent.setup()
    const evidence = makeCareerEvidence({
      evidence_id: 'exp-harness',
      category: 'EXPERIENCE',
      verification_state: 'DECLARED',
      source_class: 'SELF_DECLARED',
      revision_no: 2,
      fact_payload: { company_name: 'جهة سابقة', job_title: 'محلل للاختبار' },
    })
    render(<CareerRecordRoute port={createCareerRecordTestPort({ items: [evidence] })} />)
    expect(await screen.findByText('محلل للاختبار')).toBeInTheDocument()
    const article = screen.getByText('محلل للاختبار').closest('article')
    expect(article).toBeTruthy()
    await user.click(within(article as HTMLElement).getByRole('button', { name: ar.inspect }))
    expect(await screen.findByText(ar.disclosureBody)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: ar.close }))

    await user.click(screen.getByRole('button', { name: ar.correctFact }))
    const company = await screen.findByLabelText(ar.fields.company_name)
    await user.clear(company)
    await user.type(company, 'جهة مصححة')
    await user.click(screen.getByRole('button', { name: ar.saveCorrection }))
    expect(await screen.findByText(ar.state.CORRECTED)).toBeInTheDocument()
  })

  it('applies dispute lifecycle from the inspector via the injected port', async () => {
    const user = userEvent.setup()
    const evidence = makeCareerEvidence({
      evidence_id: 'exp-dispute',
      category: 'EXPERIENCE',
      verification_state: 'DECLARED',
      source_class: 'SELF_DECLARED',
      fact_payload: { company_name: 'جهة النزاع', job_title: 'محلل النزاع' },
    })
    render(<CareerRecordRoute port={createCareerRecordTestPort({ items: [evidence] })} />)
    await screen.findByText('محلل النزاع')
    await user.click(screen.getByRole('button', { name: ar.inspect }))
    await user.click(await screen.findByRole('button', { name: ar.lifecycle.dispute }))
    expect((await screen.findAllByText(ar.state.DISPUTED)).length).toBeGreaterThan(0)
  })

  it('renders forbidden, stale, and error from the injected port', async () => {
    const { rerender } = render(
      <CareerRecordRoute port={createCareerRecordTestPort({ list: { kind: 'forbidden' } })} />,
    )
    expect(await screen.findByText(ar.forbiddenMessage)).toBeInTheDocument()
    expect(screen.queryByText('جامعة الملك سعود')).not.toBeInTheDocument()

    rerender(
      <CareerRecordRoute
        port={createCareerRecordTestPort({
          items: populatedCareerEvidence,
          list: { kind: 'stale', asOf: '2026-08-01' },
        })}
      />,
    )
    expect(await screen.findByText(ar.staleTitle)).toBeInTheDocument()
    expect(screen.getByText('جامعة الملك سعود')).toBeInTheDocument()

    rerender(
      <CareerRecordRoute
        port={createCareerRecordTestPort({
          list: { kind: 'error', message: ar.errorMessage },
        })}
      />,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(ar.errorTitle)
  })

  it('keeps the unavailable seam honest and binds production to Core', async () => {
    expect(unavailableCareerRecordPort.availability).toBe('unavailable')
    expect(boundCareerRecordPort.availability).toBe('ready')
    for (const name of CAREER_RECORD_CORE_OPERATIONS) {
      expect(name in unavailableCareerRecordPort).toBe(true)
      expect(name in boundCareerRecordPort).toBe(true)
    }
    await expect(unavailableCareerRecordPort.updateCareerEvidenceDisclosurePolicy({
      evidence_id: 'x',
      policy_ref: { id: 'policy-private' },
    })).resolves.toEqual({ status: 'unavailable' })
    await expect(
      unavailableCareerRecordPort.authorizeCareerEvidenceDisclosure({
        evidence_id: 'x',
        purpose_code: 'CV_SHARE',
        recipient: { recipient_type: 'BUSINESS', recipient_ref: { id: 'org-1' } },
      }),
    ).resolves.toEqual({ status: 'unavailable' })
    await expect(
      unavailableCareerRecordPort.resolveAuthorizedCareerEvidenceDisclosure({
        evidence_id: 'x',
        authorization_ref: { id: 'authz-1' },
      }),
    ).resolves.toEqual({ status: 'unavailable' })
  })
})
