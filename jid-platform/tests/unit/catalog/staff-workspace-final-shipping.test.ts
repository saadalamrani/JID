import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const workspaceRoot = join(root, 'src/app/[locale]/(staff)/staff/catalog')
const operations = readFileSync(join(root, 'src/lib/staff/catalog-operations.ts'), 'utf8')
const actions = readFileSync(join(workspaceRoot, 'actions.ts'), 'utf8')
const reviewWorkspace = readFileSync(
  join(workspaceRoot, 'review/_components/catalog-review-workspace.tsx'),
  'utf8',
)
const en = JSON.parse(readFileSync(join(root, 'messages/en.json'), 'utf8')) as {
  staff: { catalog: Record<string, string> }
}
const ar = JSON.parse(readFileSync(join(root, 'messages/ar.json'), 'utf8')) as {
  staff: { catalog: Record<string, string> }
}

describe('Catalog Staff workspace final shipping boundary', () => {
  it('ships every required route inside the existing Staff shell', () => {
    for (const route of [
      'page.tsx',
      'review/page.tsx',
      'review/[candidateId]/page.tsx',
      'runs/page.tsx',
      'dead-letters/page.tsx',
    ]) {
      expect(existsSync(join(workspaceRoot, route))).toBe(true)
    }
    expect(operations).toContain('requireStaffShellAccess')
    expect(operations).toContain("profile.role !== 'staff' && profile.role !== 'super_admin'")
    expect(operations).toContain('notFound()')
  })

  it('keeps review and publication behind server actions and the existing RPC boundaries', () => {
    expect(actions.startsWith("'use server'")).toBe(true)
    expect(actions).toContain('requireCatalogStaffAccess()')
    expect(actions).toContain("client.rpc('review_directory_candidate'")
    expect(actions).toContain("client.rpc('catalog_review_pending_domain'")
    expect(actions).toContain("client.rpc('publish_directory_candidate'")
    expect(actions).not.toContain('service_role')
    expect(actions).not.toContain('NEXT_PUBLIC_')
  })

  it('renders the human review states, responsive layout, and labelled inputs', () => {
    for (const action of [
      "decide('approve')",
      "decide('approve_pending_domain')",
      "decide('return')",
      "decide('reject')",
      'publishCatalogCandidate',
    ]) {
      expect(reviewWorkspace).toContain(action)
    }
    expect(reviewWorkspace).toContain('sm:grid-cols-2')
    expect(reviewWorkspace).toContain('<label')
    expect(reviewWorkspace).toContain('role="status"')
  })

  it('keeps complete Arabic and English Catalog message parity', () => {
    expect(Object.keys(ar.staff.catalog).sort()).toEqual(Object.keys(en.staff.catalog).sort())
    expect(Object.keys(ar.staff.catalog).length).toBeGreaterThan(40)
  })

  it('bounds domain assistance against private-network fetches and unsafe redirects', () => {
    expect(actions).toContain('isPublicAddress')
    expect(actions).toContain("redirect: 'manual'")
    expect(actions).toContain("current.protocol !== 'https:'")
    expect(actions).toContain('redirectCount <= 3')
    expect(actions).toContain('200_000')
  })
})
