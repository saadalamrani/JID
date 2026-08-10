import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

describe('Dialog RTL logical direction contract', () => {
  it('uses logical end positioning for the close control', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Body</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    )

    const close = screen.getByRole('button', { name: 'Close' })
    expect(close.className).toContain('end-4')
    expect(close.className).not.toContain('right-4')
  })

  it('uses text-start instead of text-left in DialogHeader source', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ui/dialog.tsx'), 'utf8')
    expect(source).toContain('sm:text-start')
    expect(source).not.toContain('sm:text-left')
  })

  it('uses gap instead of space-x in DialogFooter source', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ui/dialog.tsx'), 'utf8')
    expect(source).toContain('sm:gap-2')
    expect(source).not.toMatch(/sm:space-x-/)
  })

  it('remains usable in both LTR and RTL containers', () => {
    const { rerender } = render(
      <div dir="ltr">
        <Dialog open>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>LTR</DialogTitle>
          </DialogContent>
        </Dialog>
      </div>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    rerender(
      <div dir="rtl">
        <Dialog open>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>RTL</DialogTitle>
          </DialogContent>
        </Dialog>
      </div>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('end-4')
  })

  it('renders header/footer landmarks when open', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accessible title</DialogTitle>
            <DialogDescription>Accessible description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button">Cancel</button>
            <button type="button">Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByRole('heading', { name: 'Accessible title' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })
})
