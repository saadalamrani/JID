import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Job board empty vs filtered-empty states', () => {
  it('distinguishes catalog empty from filtered empty in NativeResultsSection', () => {
    const source = readFileSync(
      join(
        process.cwd(),
        'src/app/[locale]/(public)/opportunities/_components/job-board-page-client.tsx',
      ),
      'utf8',
    )

    expect(source).toContain('hasActiveFilters')
    expect(source).toContain('لا توجد فرص مطابقة للفلاتر.')
    expect(source).toContain('لا توجد فرص منشورة حالياً.')
    expect(source).toContain('مسح الفلاتر')
  })
})
