/**
 * Section 14 — SEO / sitemap / robots verification.
 * Usage: pnpm tsx scripts/verify-seo.ts
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildRobots } from '../src/lib/seo/robots-config'
import { localizedPath } from '../src/lib/seo/urls'
import { SITEMAP_STATIC_ROUTES } from '../src/lib/seo/sitemap-routes'

const ROOT = process.cwd()

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8')
}

const checks: Array<[string, boolean]> = [
  ['enhanced not-found exists', existsSync(join(ROOT, 'src/app/[locale]/not-found.tsx'))],
  ['not-found is server component', !read('src/app/[locale]/not-found.tsx').includes("'use client'")],
  ['locale sitemap exists', existsSync(join(ROOT, 'src/app/[locale]/sitemap.ts'))],
  ['root sitemap exists', existsSync(join(ROOT, 'src/app/sitemap.ts'))],
  ['locale robots exists', existsSync(join(ROOT, 'src/app/[locale]/robots.ts'))],
  ['root robots re-export', read('src/app/robots.ts').includes('[locale]/robots')],
  ['static marketing routes', SITEMAP_STATIC_ROUTES.includes('/contact')],
  ['i18n notFoundPage ar', read('messages/ar.json').includes('"notFoundPage"')],
]

let failed = 0
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`FAIL: ${label}`)
    failed++
  } else {
    console.log(`PASS: ${label}`)
  }
}

const robots = buildRobots()
const disallow = robots.rules && !Array.isArray(robots.rules) ? robots.rules.disallow : []
const disallowList = Array.isArray(disallow) ? disallow : disallow ? [disallow] : []

for (const path of ['/sys', '/staff', '/api', '/company', '/mentor', '/welcome', '/individual']) {
  if (disallowList.includes(path)) {
    console.log(`PASS: robots disallows ${path}`)
  } else {
    console.error(`FAIL: robots missing disallow ${path}`)
    failed++
  }
}

if (disallowList.includes('/en/sys') && disallowList.includes('/en/staff')) {
  console.log('PASS: robots disallows /en/sys and /en/staff')
} else {
  console.error('FAIL: robots missing English-prefixed portal paths')
  failed++
}

if (localizedPath('ar', '/about') === '/about' && localizedPath('en', '/about') === '/en/about') {
  console.log('PASS: localizedPath as-needed routing')
} else {
  console.error('FAIL: localizedPath routing')
  failed++
}

if (failed > 0) {
  process.exit(1)
}

console.log(`\nAll SEO checks passed (${checks.length + 9} total).`)
