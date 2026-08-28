import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
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
import { populatedCareerEvidence } from './fixtures'

const ar = getCareerRecordCopy('ar')
const en = getCareerRecordCopy('en')

const careerRecordViewSource = readFileSync(
  join(process.cwd(), 'src/features/career-record/components/career-record-view.tsx'),
  'utf8',
)
const inspectorSource = readFileSync(
  join(process.cwd(), 'src/features/career-record/components/career-evidence-inspector.tsx'),
  'utf8',
)
const itemSource = readFileSync(
  join(process.cwd(), 'src/features/career-record/components/career-evidence-item.tsx'),
  'utf8',
)

describe('Career Record language, direction, and accessibility', () => {
  it('renders Arabic RTL and English LTR with semantic parity and no invented KPIs', () => {
    const { rerender, container } = render(
      <CareerRecordView
        state={{ status: 'ready', items: populatedCareerEvidence }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    const arRoot = screen.getByText(ar.title).closest('[dir="rtl"]')
    expect(arRoot).toHaveAttribute('lang', 'ar')
    expect(arRoot).toHaveAttribute('dir', 'rtl')
    expect(ar.state.VERIFIED).not.toEqual(en.state.VERIFIED)
    expect(container.textContent).not.toMatch(/CV Score|ATS|Completeness %|Match %/i)

    rerender(
      <CareerRecordView
        state={{ status: 'ready', items: populatedCareerEvidence }}
        copy={en}
        locale="en"
        dir="ltr"
      />,
    )
    const enRoot = screen.getByText(en.title).closest('[dir="ltr"]')
    expect(enRoot).toHaveAttribute('lang', 'en')
    expect(enRoot).toHaveAttribute('dir', 'ltr')
    expect(screen.getAllByText(en.state.VERIFIED).length).toBeGreaterThan(0)
  })

  it('keeps keyboard focus visible, opens the inspect sheet, and uses labeled dialog fields', async () => {
    const user = userEvent.setup()
    render(
      <CareerRecordView
        state={{ status: 'ready', items: populatedCareerEvidence.slice(0, 1) }}
        copy={en}
        locale="en"
        dir="ltr"
      />,
    )
    const inspect = screen.getByRole('button', { name: en.inspect })
    inspect.focus()
    expect(inspect).toHaveFocus()
    expect(inspect.className).toContain('focus-visible:ring-2')
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: en.addEvidence }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(en.fields.company_name)).toBeInTheDocument()
  })

  it('uses logical direction, mobile wrapping, screen-reader loading, touch targets, and reduced motion', () => {
    const { container } = render(
      <div style={{ width: 375 }}>
        <CareerRecordView
          state={{ status: 'loading' }}
          copy={ar}
          locale="ar"
          dir="rtl"
        />
      </div>,
    )
    expect(screen.getByText(ar.loading)).toHaveClass('sr-only')
    expect(container.firstChild).toHaveStyle({ width: '375px' })

    const combined = `${careerRecordViewSource}\n${inspectorSource}\n${itemSource}`
    expect(combined).not.toMatch(/\btext-left\b/)
    expect(combined).not.toMatch(/\btext-right\b/)
    expect(combined).not.toContain('overflow-x-scroll')
    expect(combined).toContain('flex-wrap')
    expect(combined).toContain('min-w-0')
    expect(combined).toContain('side="end"')
    expect(combined).toContain('touchTargetClass')
    expect(combined).toContain('reducedMotionClass')
    expect(combined).toContain('focusRingClass')
  })
})
