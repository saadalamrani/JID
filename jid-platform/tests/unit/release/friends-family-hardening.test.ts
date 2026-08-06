import { describe, expect, it } from 'vitest'
import { formatNumber } from '@/lib/utils/format'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Friends & Family release hardening — Latin digits on public boards', () => {
  it('formatNumber keeps Latin digits for Arabic locale', () => {
    expect(formatNumber(0, 'ar')).toBe('0')
    expect(formatNumber(6, 'ar')).toBe('6')
    expect(formatNumber(1234, 'ar')).not.toMatch(/[٠-٩]/)
  })

  it('job board and mentor discovery no longer call toLocaleString(ar-SA)', () => {
    const files = [
      'src/app/[locale]/(public)/opportunities/_components/job-board-hero.tsx',
      'src/app/[locale]/(public)/opportunities/_components/results-count-bar.tsx',
      'src/app/[locale]/(public)/mentors/_components/mentor-discovery-hero.tsx',
    ]
    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      expect(source, file).not.toContain("toLocaleString('ar-SA')")
      expect(source, file).toContain('formatNumber')
    }
  })

  it('company jobs list route exists and is guarded', () => {
    const page = readFileSync(
      join(process.cwd(), 'src/app/[locale]/(company)/jobs/page.tsx'),
      'utf8',
    )
    expect(page).toContain('fetchOwnerManagedJobs')
    expect(page).toContain('company-jobs-list')

    const guards = readFileSync(join(process.cwd(), 'src/lib/auth/guards.ts'), 'utf8')
    expect(guards).toContain("id: 'company-jobs-list'")
  })

  it('credential auth forms force POST to avoid password-in-URL GET submits', () => {
    const files = [
      'src/app/[locale]/(auth)/login/page.tsx',
      'src/app/[locale]/(auth)/signup/page.tsx',
      'src/app/[locale]/(auth)/forgot-password/page.tsx',
      'src/app/[locale]/(auth)/reset-password/page.tsx',
      'src/app/[locale]/(sys)/sys/login/page.tsx',
    ]
    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      expect(source, file).toMatch(/method=["']post["']/)
    }
    const login = readFileSync(
      join(process.cwd(), 'src/app/[locale]/(auth)/login/page.tsx'),
      'utf8',
    )
    expect(login).toContain("searchParams.delete('password')")
  })
})
