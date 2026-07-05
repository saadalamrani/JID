/**
 * Verify catalog seed distribution (run after db reset or against live DB).
 * Usage:
 *   pnpm tsx scripts/verify-catalog-seed.ts          # distribution simulation
 *   pnpm tsx scripts/verify-catalog-seed.ts --db     # query local Supabase (needs Docker)
 */

import { createClient } from '@supabase/supabase-js'

const COUNT = 1050

const REGION_SLUGS = [
  'riyadh',
  'eastern-province',
  'makkah',
  'madinah',
  'qassim',
  'asir',
  'tabuk',
  'hail',
  'northern-borders',
  'jazan',
  'najran',
  'al-bahah',
  'al-jawf',
] as const

function pickRegionIndex(i: number): number {
  const bucket = i % 100
  if (bucket < 35) return 0
  if (bucket < 55) return 1
  if (bucket < 75) return 2
  return 3 + (i % 10)
}

function pickOwnership(i: number): string {
  const bucket = i % 100
  if (bucket < 30) return 'government'
  if (bucket < 55) return 'semi_government'
  return 'private'
}

function simulateDistribution() {
  const ownership: Record<string, number> = {}
  const regions: Record<string, number> = {}
  const sectors: Record<number, number> = {}

  for (let i = 1; i <= COUNT; i++) {
    const own = pickOwnership(i)
    ownership[own] = (ownership[own] ?? 0) + 1

    const regionIdx = pickRegionIndex(i)
    const slug = REGION_SLUGS[regionIdx] ?? 'other'
    regions[slug] = (regions[slug] ?? 0) + 1

    const sectorN = (i % 45) + 1
    sectors[sectorN] = (sectors[sectorN] ?? 0) + 1
  }

  return { ownership, regions, sectors }
}

function topEntries(map: Record<string, number>, n: number) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

async function queryDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''

  if (!key) {
    console.error('Set SUPABASE_SERVICE_ROLE_KEY to query the database.')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const { count: companyCount, error: countError } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  if (countError) throw new Error(countError.message)

  console.log(`\n=== LIVE DB: companies total = ${companyCount ?? 0} ===\n`)

  const { data: ownershipRows, error: ownError } = await supabase.rpc('catalog_seed_ownership_stats' as never)
  if (ownError) {
    // Fallback: raw SQL via multiple queries not available — use sector/region counts
    const { data: companies, error } = await supabase
      .from('companies')
      .select('ownership_type, region_id, sector_id, slug')
      .like('slug', '%-1')
      .limit(5000)

    if (error) throw new Error(error.message)

    const ownMap: Record<string, number> = {}
    for (const row of companies ?? []) {
      const key = (row.ownership_type as string) ?? 'null'
      ownMap[key] = (ownMap[key] ?? 0) + 1
    }
    console.log('By ownership_type (catalog seed slugs sample):', ownMap)
  }

  const { count: sectorCount } = await supabase
    .from('sectors')
    .select('*', { count: 'exact', head: true })
  const { count: regionCount } = await supabase
    .from('regions')
    .select('*', { count: 'exact', head: true })

  console.log(`Sectors: ${sectorCount ?? 0}, Regions: ${regionCount ?? 0}`)
}

function printSimulation() {
  const { ownership, regions, sectors } = simulateDistribution()

  console.log('=== EXPECTED SEED DISTRIBUTION (1050 catalog companies) ===\n')
  console.log('By ownership_type:')
  for (const [k, v] of Object.entries(ownership).sort()) {
    console.log(`  ${k}: ${v} (${((v / COUNT) * 100).toFixed(1)}%)`)
  }

  console.log('\nBy region (top 5):')
  for (const [k, v] of topEntries(regions, 5)) {
    console.log(`  ${k}: ${v} (${((v / COUNT) * 100).toFixed(1)}%)`)
  }

  console.log('\nBy sector slot (top 10 sector indices 1–45):')
  const sectorTop = Object.entries(sectors)
    .map(([k, v]) => [Number(k), v] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  for (const [idx, v] of sectorTop) {
    console.log(`  sector #${idx}: ${v} companies`)
  }

  console.log('\nNote: Each of 45 sectors receives ~23 companies (1050/45).')
}

const useDb = process.argv.includes('--db')

if (useDb) {
  void queryDatabase()
} else {
  printSimulation()
  console.log('\n--- SQL to run after `pnpm supabase db reset` ---\n')
  console.log(`SELECT COUNT(*) AS companies_total FROM companies;`)
  console.log(`SELECT ownership_type, COUNT(*) FROM companies WHERE slug LIKE '%-%-%' GROUP BY 1 ORDER BY 2 DESC;`)
  console.log(`SELECT r.name_en, COUNT(*) FROM companies c JOIN regions r ON r.id = c.region_id WHERE c.id::text LIKE 'f3000001%' GROUP BY r.name_en ORDER BY 2 DESC LIMIT 5;`)
  console.log(`SELECT s.name_en, COUNT(*) FROM companies c JOIN sectors s ON s.id = c.sector_id WHERE c.id::text LIKE 'f3000001%' GROUP BY s.name_en ORDER BY 2 DESC LIMIT 10;`)
}
