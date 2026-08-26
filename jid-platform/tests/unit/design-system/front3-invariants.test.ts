import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { focusRingClass, reducedMotionClass, touchTargetClass } from '@/lib/ui/a11y'

const foundationFiles = [
  'src/components/ui/status-badge.tsx',
  'src/components/ui/page-header.tsx',
  'src/components/ui/filter-bar.tsx',
  'src/components/ui/dialog.tsx',
  'src/components/ui/sheet.tsx',
  'src/components/ui/form-field.tsx',
  'src/components/ui/surface-state.tsx',
  'src/components/ui/metric-figure.tsx',
  'src/lib/ui/contract-presentation.ts',
]

describe('Front 3 foundation invariants', () => {
  it('uses semantic color roles instead of raw hex in touched shared files', () => {
    for (const relativePath of foundationFiles) {
      const source = readFileSync(join(process.cwd(), relativePath), 'utf8')
      expect(source, relativePath).not.toMatch(/#[0-9A-Fa-f]{3,8}/)
      expect(source, relativePath).not.toMatch(/from-\[[^\]]*blue/i)
      expect(source, relativePath).not.toMatch(/glassmorphism|backdrop-blur|drop-shadow|aurora/i)
    }
  })

  it('does not invent competing domain enums or public actors', () => {
    const source = readFileSync(join(process.cwd(), 'src/lib/ui/contract-presentation.ts'), 'utf8')
    expect(source).toContain("from '@/types/contracts'")
    expect(source).not.toContain(
      "export const PUBLIC_ACTOR_TYPES = ['INDIVIDUAL', 'BUSINESS', 'UNIVERSITY', 'MENTOR']",
    )
    expect(source).not.toContain("'GOVERNMENT'")
    expect(source).toContain('UNIVERSITY_AFFILIATION_STATES')
  })

  it('does not implement Wave 2+ product screens', () => {
    const touched = [
      'src/components/ui/surface-state.tsx',
      'src/components/ui/metric-figure.tsx',
      'src/components/ui/automation-review-callout.tsx',
      'src/lib/ui/contract-presentation.ts',
    ]
    for (const relativePath of touched) {
      const source = readFileSync(join(process.cwd(), relativePath), 'utf8')
      expect(source, relativePath).not.toMatch(/Radar|Abhathli|CV Builder|Hiring Workspace/)
    }
  })

  it('exports focus, touch-target, and reduced-motion helpers', () => {
    expect(focusRingClass).toContain('focus-visible:ring-ring')
    expect(touchTargetClass).toContain('min-h-11')
    expect(reducedMotionClass).toContain('motion-reduce:animate-none')
  })
})
