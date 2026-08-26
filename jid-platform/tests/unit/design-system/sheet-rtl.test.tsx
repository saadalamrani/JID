import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Sheet } from '@/components/ui/sheet'

describe('Sheet RTL / LTR and reduced motion', () => {
  it('anchors start and end sides with logical properties', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ui/sheet.tsx'), 'utf8')
    expect(source).toContain('start-0')
    expect(source).toContain('end-0')
    expect(source).toContain('rtl:data-[state=open]:slide-in-from-right')
    expect(source).toContain('reducedMotionClass')
    expect(source).not.toMatch(/left-0(?!-)/)
  })

  it('renders in LTR and RTL with a named close control', () => {
    const { rerender } = render(
      <div dir="ltr">
        <Sheet open onOpenChange={() => undefined} title="Filters" closeLabel="Close">
          Body
        </Sheet>
      </div>,
    )
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('end-3')

    rerender(
      <div dir="rtl">
        <Sheet open onOpenChange={() => undefined} title="المرشحات" closeLabel="إغلاق" side="start">
          المحتوى
        </Sheet>
      </div>,
    )
    expect(screen.getByRole('dialog', { name: 'المرشحات' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'إغلاق' })).toBeInTheDocument()
  })
})
