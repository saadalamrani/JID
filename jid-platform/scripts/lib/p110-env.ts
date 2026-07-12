import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function loadEnvFile(filename: string): Record<string, string> {
  const filePath = join(process.cwd(), filename)
  if (!existsSync(filePath)) return {}

  const vars: Record<string, string> = {}
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
  }
  return vars
}

export function loadRuntimeEnv(): Record<string, string> {
  return { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
}

/** Mirrors src/lib/supabase/admin.ts — service role, no session (scripts cannot import server-only). */
export function createP110AdminClient(env: Record<string, string>): SupabaseClient {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (set in .env.local).',
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type P110CliFlags = {
  dryRun: boolean
  execute: boolean
  understand: boolean
  simulate: boolean
}

export function parseP110Flags(argv: string[]): P110CliFlags {
  const execute = argv.includes('--execute')
  return {
    execute,
    dryRun: !execute,
    understand: argv.includes('--i-understand-this-modifies-production-data'),
    simulate: argv.includes('--simulate'),
  }
}

export function assertWriteSafety(flags: P110CliFlags, env: Record<string, string>): void {
  if (flags.simulate) return

  if (flags.execute && !flags.understand) {
    console.error(
      '\nREFUSED: --execute requires --i-understand-this-modifies-production-data\n',
    )
    process.exit(1)
  }

  if (flags.execute && env.NEXT_PUBLIC_APP_ENV === 'production') {
    if (env.BACKFILL_PROD_CONFIRM !== 'yes-i-am-sure') {
      console.error(
        '\nREFUSED: production write blocked. Set BACKFILL_PROD_CONFIRM=yes-i-am-sure in addition to all execute flags.\n',
      )
      process.exit(1)
    }
  }
}

export function verificationTypeForEntity(
  entityType: string | null | undefined,
): 'business' | 'university' {
  return entityType === 'university' ? 'university' : 'business'
}

export const SYNTHESIZED_REVIEW_NOTES =
  '[SYSTEM BACKFILL] synthesized from legacy claimed_by — no original verification record found'
