import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button, buttonVariants } from '@/components/ui/button'

describe('Button brand variant', () => {
  it('preserves existing default API', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('exposes restrained brand/gold high-emphasis variant', () => {
    render(<Button variant="brand">Publish</Button>)
    const button = screen.getByRole('button', { name: 'Publish' })
    expect(button).toHaveClass('bg-accent')
    expect(button.className).not.toMatch(/shadow|scale|translate|gradient/)
  })

  it('keeps prior variants available without regression', () => {
    expect(buttonVariants({ variant: 'default' })).toContain('bg-primary')
    expect(buttonVariants({ variant: 'destructive' })).toContain('bg-destructive')
    expect(buttonVariants({ variant: 'outline' })).toContain('border')
    expect(buttonVariants({ variant: 'secondary' })).toContain('bg-secondary')
    expect(buttonVariants({ variant: 'ghost' })).toBeTruthy()
    expect(buttonVariants({ variant: 'link' })).toContain('underline')
    expect(buttonVariants({ variant: 'brand' })).toContain('bg-accent')
  })
})
