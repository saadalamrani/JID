/**
 * Cloud-safe test-account seed for the approved NON-PRODUCTION Supabase project.
 *
 * Reuses:
 *   - supabase/seed/local-test-accounts.sql
 *   - supabase/seed/shareable-test-premium-entitlements.sql (JID_SHAREABLE_TEST_SEED_V2)
 *
 * NEVER seeds production. Hard-pins project ref + shareable site URL.
 *
 * Usage:
 *   pnpm seed:cloud-test --print-matrix
 *   pnpm seed:cloud-test --print-whatsapp
 *   pnpm seed:cloud-test --print-premium-matrix
 *   pnpm seed:cloud-test --print-internal
 *   pnpm seed:cloud-test                 # dry-run safety check
 *   pnpm seed:cloud-test --execute --i-confirm-non-production
 *
 * Env file: .env.seed.nonprod (see .env.seed.nonprod.example)
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { loadEnvFile } from './lib/p110-env'
import {
  ALLOWED_NONPROD_PROJECT_REF,
  ALLOWED_SEED_ENVS,
  EXPECTED_SHAREABLE_SITE_URL,
  SEED_PASSWORD,
  SEED_PREMIUM_SQL_RELATIVE,
  SEED_SQL_RELATIVE,
  SHAREABLE_SEED_MARKER,
  SHAREABLE_TEST_ACCOUNTS,
  assertAllowedProjectRefs,
  assertExpectedShareableSiteUrl,
  assertExecuteConfirmation,
  assertPrivilegedDbCredential,
  assertSeedEnvAllowed,
  formatArabicAccessTable,
  formatFounderInternalMessage,
  formatPremiumAccessMatrixMarkdown,
  formatWhatsAppMessage,
  isLocalDbUrl,
  looksLikeProductionTarget,
  normalizeSiteUrl,
} from './lib/seed-safety'

function loadSeedEnv(): Record<string, string> {
  return {
    ...loadEnvFile('.env'),
    ...loadEnvFile('.env.local'),
    ...loadEnvFile('.env.seed.nonprod'),
    ...(process.env as Record<string, string>),
  }
}

function parseArgs(argv: string[]) {
  return {
    execute: argv.includes('--execute'),
    confirmNonProd: argv.includes('--i-confirm-non-production'),
    allowLocal: argv.includes('--allow-local'),
    printMatrix: argv.includes('--print-matrix'),
    printWhatsapp: argv.includes('--print-whatsapp'),
    printPremiumMatrix: argv.includes('--print-premium-matrix'),
    printInternal: argv.includes('--print-internal'),
    verifyLogins: argv.includes('--verify-logins'),
  }
}

function resolveSiteUrl(env: Record<string, string>): string {
  return normalizeSiteUrl(
    env.SHAREABLE_TEST_SITE_URL || env.NEXT_PUBLIC_SITE_URL || EXPECTED_SHAREABLE_SITE_URL,
  )
}

function resolveDbUrl(env: Record<string, string>): string | undefined {
  return (
    env.SEED_DATABASE_URL ||
    env.DATABASE_URL ||
    env.SUPABASE_DB_URL ||
    env.POSTGRES_URL ||
    undefined
  )
}

function runSqlFile(dbUrl: string, sqlPath: string): void {
  // Prefer dockerized psql — reliable on Windows where local CLI lacks `db execute`.
  const docker = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-i',
      '-v',
      `${sqlPath}:/seed.sql:ro`,
      'postgres:15-alpine',
      'psql',
      dbUrl,
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      '/seed.sql',
    ],
    { encoding: 'utf-8', shell: true },
  )

  if (docker.status === 0) {
    console.log(docker.stdout)
    if (docker.stderr) console.error(docker.stderr)
    return
  }

  console.warn(
    'dockerized psql failed; trying supabase@2.111.0 db query…\n',
    docker.stderr || docker.stdout || `exit ${docker.status}`,
  )

  const sql = readFileSync(sqlPath, 'utf8')
  const supabaseQuery = spawnSync(
    'npx',
    ['--yes', 'supabase@2.111.0', 'db', 'query', '--db-url', dbUrl, sql],
    { encoding: 'utf-8', shell: true },
  )

  if (supabaseQuery.status === 0) {
    console.log(supabaseQuery.stdout)
    if (supabaseQuery.stderr) console.error(supabaseQuery.stderr)
    return
  }

  const psql = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', sqlPath], {
    encoding: 'utf-8',
    shell: true,
  })

  if (psql.status !== 0) {
    throw new Error(
      `Failed to apply seed SQL.\n` +
        `docker psql: ${docker.stderr || docker.stdout}\n` +
        `supabase db query: ${supabaseQuery.stderr || supabaseQuery.stdout}\n` +
        `psql: ${psql.stderr || psql.stdout}`,
    )
  }

  console.log(psql.stdout)
}

function refuse(message: string): never {
  console.error(`\nREFUSED: ${message}\n`)
  process.exit(1)
}

async function verifyPasswordLogins(env: Record<string, string>): Promise<void> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    console.warn('Skipping login verification: missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY')
    return
  }

  const client = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\n=== Live password login verification (Supabase Auth) ===\n')
  for (const row of SHAREABLE_TEST_ACCOUNTS) {
    const { data, error } = await client.auth.signInWithPassword({
      email: row.email,
      password: SEED_PASSWORD,
    })
    if (error || !data.user) {
      console.error(`FAIL ${row.email}: ${error?.message ?? 'no user'}`)
      continue
    }
    const confirmed = Boolean(data.user.email_confirmed_at ?? data.user.confirmed_at)
    console.log(
      `OK   ${row.email} role_hint=${row.role} confirmed=${confirmed} aal=${data.session?.aal ?? 'n/a'}`,
    )
    await client.auth.signOut()
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = loadSeedEnv()
  const siteUrlRaw = resolveSiteUrl(env)

  if (args.printMatrix) {
    console.log(formatArabicAccessTable(siteUrlRaw))
    process.exit(0)
  }

  if (args.printWhatsapp) {
    console.log(formatWhatsAppMessage(siteUrlRaw))
    process.exit(0)
  }

  if (args.printPremiumMatrix) {
    console.log(formatPremiumAccessMatrixMarkdown())
    process.exit(0)
  }

  if (args.printInternal) {
    console.log(formatFounderInternalMessage(siteUrlRaw))
    process.exit(0)
  }

  console.log('\n=== JID cloud-safe test account seed ===\n')
  console.log(`Marker: ${SHAREABLE_SEED_MARKER}`)
  console.log(`Allowed project ref: ${ALLOWED_NONPROD_PROJECT_REF}`)
  console.log(`Expected site URL: ${EXPECTED_SHAREABLE_SITE_URL}`)
  console.log('Accounts planned:')
  for (const row of SHAREABLE_TEST_ACCOUNTS) {
    console.log(
      `  - ${row.email} (${row.role}) share=${row.shareWithFriends ? 'friends' : 'internal'} premium=${row.premiumAr}`,
    )
  }
  console.log(`\nSQL fixtures:\n  - ${SEED_SQL_RELATIVE}\n  - ${SEED_PREMIUM_SQL_RELATIVE}`)
  console.log(`Password: ${SEED_PASSWORD}`)
  console.log(`Site URL for matrix: ${siteUrlRaw}`)

  let dbUrl: string
  try {
    dbUrl = assertPrivilegedDbCredential(resolveDbUrl(env))
  } catch (error) {
    refuse((error as Error).message)
  }

  const prodReason = looksLikeProductionTarget({
    dbUrl,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    siteUrl: env.NEXT_PUBLIC_SITE_URL ?? env.SHAREABLE_TEST_SITE_URL,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    appEnv: env.NEXT_PUBLIC_APP_ENV,
    seedEnv: env.SEED_ENV,
  })
  if (prodReason) {
    refuse(`production target blocked (${prodReason}). This script never seeds production.`)
  }

  let seedEnv: string
  try {
    seedEnv = assertSeedEnvAllowed(env.SEED_ENV)
  } catch (error) {
    console.error(`Set SEED_ENV in .env.seed.nonprod to one of: ${ALLOWED_SEED_ENVS.join(', ')}`)
    refuse((error as Error).message)
  }

  if (isLocalDbUrl(dbUrl) && !args.allowLocal) {
    refuse(
      'SEED_DATABASE_URL looks local. For local fixtures use: pnpm seed:local. To force this script against local Postgres, pass --allow-local',
    )
  }

  if (!args.allowLocal) {
    try {
      assertAllowedProjectRefs({
        supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
        dbUrl,
      })
      assertExpectedShareableSiteUrl(env.SHAREABLE_TEST_SITE_URL || env.NEXT_PUBLIC_SITE_URL)
    } catch (error) {
      refuse((error as Error).message)
    }
  }

  console.log(`SEED_ENV: ${seedEnv}`)
  console.log(`DB host: ${dbUrl.replace(/:[^:@/]+@/, ':***@').slice(0, 80)}…`)

  if (!args.execute) {
    console.log('\nDry-run only. No writes performed.')
    console.log('To apply fixtures to the NON-PROD database:')
    console.log('  pnpm seed:cloud-test --execute --i-confirm-non-production\n')
    console.log('--- Arabic access table (template) ---\n')
    console.log(formatArabicAccessTable(siteUrlRaw))
    process.exit(0)
  }

  try {
    assertExecuteConfirmation({
      execute: args.execute,
      confirmNonProd: args.confirmNonProd,
    })
  } catch (error) {
    refuse((error as Error).message)
  }

  const accountSqlPath = join(process.cwd(), SEED_SQL_RELATIVE)
  const premiumSqlPath = join(process.cwd(), SEED_PREMIUM_SQL_RELATIVE)
  if (!existsSync(accountSqlPath)) {
    refuse(`Missing seed SQL at ${accountSqlPath}`)
  }
  if (!existsSync(premiumSqlPath)) {
    refuse(`Missing premium seed SQL at ${premiumSqlPath}`)
  }

  console.log('\nApplying account seed SQL to NON-PROD database…')
  runSqlFile(dbUrl, accountSqlPath)

  console.log('\nApplying premium entitlement seed SQL (JID_SHAREABLE_TEST_SEED_V2)…')
  runSqlFile(dbUrl, premiumSqlPath)

  console.log('\n✓ Seed applied (or re-applied idempotently).')

  // Always verify password login after a successful remote execute.
  // --verify-logins is reserved for future dry re-checks without reseed.
  void args.verifyLogins
  await verifyPasswordLogins(env)

  console.log('\n--- Arabic access table ---\n')
  console.log(formatArabicAccessTable(siteUrlRaw))
  console.log('\n--- Premium access matrix ---\n')
  console.log(formatPremiumAccessMatrixMarkdown())
  console.log('\n--- WhatsApp friend message ---\n')
  console.log(formatWhatsAppMessage(siteUrlRaw))
  console.log('\n--- Founder internal (do not share) ---\n')
  console.log(formatFounderInternalMessage(siteUrlRaw))
  console.log(
    '\nRemember: shareable Vercel app must bind to the same NON-PROD Supabase project',
  )
  console.log(`(${ALLOWED_NONPROD_PROJECT_REF}). Never share production.\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
