import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils/cn'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('resolves conflicting Tailwind utilities via tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('ignores falsy values', () => {
    expect(cn('base', false && 'hidden', undefined, null, 'end')).toBe('base end')
  })
})
