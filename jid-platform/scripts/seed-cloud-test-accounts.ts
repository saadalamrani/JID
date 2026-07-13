/**
 * Cloud-safe test-account seed for a NON-PRODUCTION remote Supabase database.
 *
 * Reuses: supabase/seed/local-test-accounts.sql (idempotent, architecture-correct).
 * Auth path: direct SQL into auth.users (same as local) via Postgres connection string.
 *
 * NEVER seeds production. There is no override for friend-facing seeding.
 *
 * Usage:
 *   pnpm seed:cloud-test --print-matrix
 *   pnpm seed:cloud-test --print-whatsapp
 *   pnpm seed:cloud-test                 # dry-run safety check
 *   pnpm seed:cloud-test --execute --i-confirm-non-production
 *
 * Env file: .env.seed.nonprod (see .env.seed.nonprod.example)
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { loadEnvFile } from './lib/p110-env'
import {
  ALLOWED_SEED_ENVS,
  SEED_SQL_RELATIVE,
  SHAREABLE_TEST_ACCOUNTS,
  assertSeedEnvAllowed,
  formatArabicAccessTable,
  formatWhatsAppMessage,
  isLocalDbUrl,
  looksLikeProductionTarget,
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
  }
}

function resolveSiteUrl(env: Record<string, string>): string {
  return (
    env.SHAREABLE_TEST_SITE_URL?.replace(/\/$/, '') ||
    env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://YOUR-NONPROD-VERCEL-URL.vercel.app'
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
  const supabase = spawnSync(
    'npx',
    ['supabase', 'db', 'execute', '--db-url', dbUrl, '--file', sqlPath],
    { encoding: 'utf-8', shell: true },
  )

  if (supabase.status === 0) {
    console.log(supabase.stdout)
    if (supabase.stderr) console.error(supabase.stderr)
    return
  }

  console.warn(
    'supabase db execute failed; trying psql…\n',
    supabase.stderr || supabase.stdout || `exit ${supabase.status}`,
  )

  const psql = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', sqlPath], {
    encoding: 'utf-8',
    shell: true,
  })

  if (psql.status !== 0) {
    throw new Error(
      `Failed to apply seed SQL.\nsupabase: ${supabase.stderr || supabase.stdout}\npsql: ${psql.stderr || psql.stdout}`,
    )
  }

  console.log(psql.stdout)
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = loadSeedEnv()
  const siteUrl = resolveSiteUrl(env)

  if (args.printMatrix) {
    console.log(formatArabicAccessTable(siteUrl))
    process.exit(0)
  }

  if (args.printWhatsapp) {
    console.log(formatWhatsAppMessage(siteUrl))
    process.exit(0)
  }

  console.log('\n=== JID cloud-safe test account seed ===\n')
  console.log('Accounts planned:')
  for (const row of SHAREABLE_TEST_ACCOUNTS) {
    console.log(
      `  - ${row.email} (${row.role}) share=${row.shareWithFriends ? 'friends' : 'internal'}`,
    )
  }
  console.log(`\nSQL fixture: ${SEED_SQL_RELATIVE}`)
  console.log(`Password: JidSeed123!`)
  console.log(`Site URL for matrix: ${siteUrl}`)

  const dbUrl = resolveDbUrl(env)
  if (!dbUrl) {
    console.error(
      '\nREFUSED: missing SEED_DATABASE_URL (Postgres connection string for the NON-PROD project).\n' +
        'Copy .env.seed.nonprod.example → .env.seed.nonprod and fill values.\n' +
        'Do NOT point this at production.\n',
    )
    console.log('\n--- Arabic access table (template; accounts not created yet) ---\n')
    console.log(formatArabicAccessTable(siteUrl))
    process.exit(1)
  }

  const prodReason = looksLikeProductionTarget({
    dbUrl,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    siteUrl: env.NEXT_PUBLIC_SITE_URL ?? env.SHAREABLE_TEST_SITE_URL,
    appEnv: env.NEXT_PUBLIC_APP_ENV,
    seedEnv: env.SEED_ENV,
  })
  if (prodReason) {
    console.error(`\nREFUSED: production target blocked (${prodReason}).`)
    console.error('This script never seeds production. Use a separate non-prod Supabase project.\n')
    process.exit(1)
  }

  let seedEnv: string
  try {
    seedEnv = assertSeedEnvAllowed(env.SEED_ENV)
  } catch (error) {
    console.error(`\nREFUSED: ${(error as Error).message}`)
    console.error(`Set SEED_ENV in .env.seed.nonprod to one of: ${ALLOWED_SEED_ENVS.join(', ')}\n`)
    process.exit(1)
  }

  if (isLocalDbUrl(dbUrl) && !args.allowLocal) {
    console.error(
      '\nREFUSED: SEED_DATABASE_URL looks local.\n' +
        'For local fixtures use: pnpm seed:local\n' +
        'To force this script against local Postgres, pass --allow-local\n',
    )
    process.exit(1)
  }

  console.log(`SEED_ENV: ${seedEnv}`)
  console.log(`DB host: ${dbUrl.replace(/:[^:@/]+@/, ':***@').slice(0, 80)}…`)

  if (!args.execute) {
    console.log('\nDry-run only. No writes performed.')
    console.log('To apply fixtures to the NON-PROD database:')
    console.log('  pnpm seed:cloud-test --execute --i-confirm-non-production\n')
    console.log('--- Arabic access table (template) ---\n')
    console.log(formatArabicAccessTable(siteUrl))
    process.exit(0)
  }

  if (!args.confirmNonProd) {
    console.error(
      '\nREFUSED: --execute requires --i-confirm-non-production\n' +
        'Confirm you are targeting a disposable non-production Supabase project.\n',
    )
    process.exit(1)
  }

  const sqlPath = join(process.cwd(), SEED_SQL_RELATIVE)
  if (!existsSync(sqlPath)) {
    console.error(`Missing seed SQL at ${sqlPath}`)
    process.exit(1)
  }

  console.log('\nApplying seed SQL to NON-PROD database…')
  runSqlFile(dbUrl, sqlPath)

  console.log('\n✓ Seed applied (or re-applied idempotently).')
  console.log('\n--- Arabic access table ---\n')
  console.log(formatArabicAccessTable(siteUrl))
  console.log('\n--- WhatsApp message ---\n')
  console.log(formatWhatsAppMessage(siteUrl))
  console.log(
    '\nRemember: point the shareable Vercel preview/app at this same NON-PROD Supabase project',
  )
  console.log('(NEXT_PUBLIC_SUPABASE_URL + ANON_KEY + SITE_URL). Never share production.\n')
}

main()
