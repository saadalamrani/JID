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

import { CvProjectionView } from '@/features/cv-projection/components/cv-projection-view'
import { getCvProjectionCopy } from '@/features/cv-projection/copy'
import { makeCareerEvidence } from '../career-record/fixtures'
import { makeCvProjection } from './fixtures'

const ar = getCvProjectionCopy('ar')
const en = getCvProjectionCopy('en')

const viewSource = readFileSync(
  join(process.cwd(), 'src/features/cv-projection/components/cv-projection-view.tsx'),
  'utf8',
)
const shareSource = readFileSync(
  join(process.cwd(), 'src/features/cv-projection/components/cv-share-panel.tsx'),
  'utf8',
)
const previewSource = readFileSync(
  join(process.cwd(), 'src/features/cv-projection/components/cv-preview-panel.tsx'),
  'utf8',
)

describe('CV projection language, direction, and accessibility', () => {
  it('renders Arabic RTL and English LTR with labeled fields and private default', () => {
    const projection = makeCvProjection({
      evidence: [
        makeCareerEvidence({
          evidence_id: 'skill-a11y',
          category: 'SKILL',
          verification_state: 'DECLARED',
          source_class: 'SELF_DECLARED',
          fact_payload: { name: 'SQL' },
        }),
      ],
      items: [],
    })
    const { rerender } = render(
      <CvProjectionView
        state={{ status: 'ready', projection }}
        copy={ar}
        locale="ar"
        dir="rtl"
      />,
    )
    expect(screen.getByText(ar.title).closest('[dir="rtl"]')).toHaveAttribute('lang', 'ar')
    expect(screen.getByLabelText(ar.cvTitle)).toBeInTheDocument()
    expect(screen.getAllByText(ar.sharePrivate).length).toBeGreaterThan(0)

    rerender(
      <CvProjectionView
        state={{ status: 'ready', projection }}
        copy={en}
        locale="en"
        dir="ltr"
      />,
    )
    expect(screen.getByText(en.title).closest('[dir="ltr"]')).toHaveAttribute('lang', 'en')
    expect(screen.getByLabelText(en.cvTitle)).toBeInTheDocument()
    expect(ar.include).not.toEqual(en.include)
  })

  it('keeps include, dialog, and share controls keyboard-accessible with visible focus', async () => {
    const user = userEvent.setup()
    render(
      <CvProjectionView
        state={{
          status: 'ready',
          projection: makeCvProjection({
            evidence: [
              makeCareerEvidence({
                evidence_id: 'exp-a11y',
                category: 'EXPERIENCE',
                verification_state: 'DECLARED',
                source_class: 'SELF_DECLARED',
                fact_payload: { company_name: 'جهة', job_title: 'محلل' },
              }),
            ],
            items: [
              {
                evidence_id: 'exp-a11y',
                section_key: 'EXPERIENCE',
                sort_order: 0,
                is_selected: true,
                presentation_payload: {},
              },
            ],
          }),
        }}
        copy={en}
        locale="en"
        dir="ltr"
      />,
    )
    const includeOrExclude = screen.getByRole('button', { name: en.exclude })
    includeOrExclude.focus()
    expect(includeOrExclude).toHaveFocus()
    expect(includeOrExclude.className).toContain('min-h-11')

    await user.click(screen.getByRole('button', { name: en.presentationWording }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(en.displayTitle)).toBeInTheDocument()
  })

  it('uses logical direction, mobile wrapping, reduced motion, and no horizontal overflow classes', () => {
    render(
      <div style={{ width: 375 }}>
        <CvProjectionView
          state={{ status: 'ready', projection: makeCvProjection() }}
          copy={ar}
          locale="ar"
          dir="rtl"
        />
      </div>,
    )
    expect(screen.getByText(ar.title).closest('[dir="rtl"]')).toHaveClass(
      'motion-reduce:animate-none',
    )

    const combined = `${viewSource}\n${shareSource}\n${previewSource}`
    expect(combined).toContain('border-s-2')
    expect(combined).toContain('ps-4')
    expect(combined).toContain('min-w-0')
    expect(combined).toContain('flex-wrap')
    expect(combined).not.toMatch(/\bml-\d/)
    expect(combined).not.toMatch(/\bmr-\d/)
    expect(combined).not.toContain('overflow-x-scroll')
    expect(combined).toContain('touchTargetClass')
    expect(combined).toContain('focusRingClass')
    expect(combined).toContain('aria-labelledby')
  })
})
