import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseServerEnv } from '../src/lib/env'

function loadEnvFile(filename: string): Record<string, string> {
  const filePath = resolve(process.cwd(), filename)
  if (!existsSync(filePath)) return {}

  const vars: Record<string, string> = {}
  const lines = readFileSync(filePath, 'utf-8').split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
    vars[key] = value
  }

  return vars
}

function main(): void {
  const fileVars = {
    ...loadEnvFile('.env'),
    ...loadEnvFile('.env.local'),
  }

  const merged = { ...fileVars, ...process.env }

  try {
    const env = parseServerEnv(merged)
    console.log('✓ Environment variables are valid')
    console.log(`  Supabase URL : ${env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`  Site URL     : ${env.NEXT_PUBLIC_SITE_URL}`)
    console.log(`  NODE_ENV     : ${env.NODE_ENV}`)
    process.exit(0)
  } catch (error) {
    console.error('✗ Environment validation failed:\n')
    console.error(error instanceof Error ? error.message : String(error))
    console.error('\nCopy .env.example to .env.local and fill in your Supabase credentials.')
    process.exit(1)
  }
}

main()
