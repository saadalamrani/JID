import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(entry) ? [path] : []
  })
}

describe('JID-102A legacy catalog Claim retirement', () => {
  it('removes the route, privileged helper, and directly connected public entry point', () => {
    expect(existsSync(join(root, 'src/app/api/catalog/claim/route.ts'))).toBe(false)
    expect(existsSync(join(root, 'src/lib/catalog/claim.ts'))).toBe(false)
    expect(existsSync(join(root, 'src/components/profile/unclaimed-cta.tsx'))).toBe(false)
  })

  it('leaves no application caller for the retired API or privileged helper', () => {
    const applicationSource = sourceFiles(join(root, 'src'))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n')

    expect(applicationSource).not.toContain('/api/catalog/claim')
    expect(applicationSource).not.toContain('submitCatalogClaim')
    expect(applicationSource).not.toContain('checkClaimableProfile')
  })

  it('preserves the independent organization verification submission service', () => {
    const submissionService = readFileSync(join(root, 'src/lib/entity/claims.ts'), 'utf8')
    const signupForm = readFileSync(
      join(root, 'src/components/entity/claim-submission-form.tsx'),
      'utf8',
    )

    expect(submissionService).toContain(".from('verification_requests')")
    expect(submissionService).not.toContain('/api/catalog/claim')
    expect(signupForm).toContain('submitClaimRequest')
    expect(signupForm).not.toContain('/api/catalog/claim')
  })
})
