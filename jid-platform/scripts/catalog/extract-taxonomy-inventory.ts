import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseFounderSourceCsv } from '../../src/lib/catalog/founder-source'

const path = join(process.cwd(), 'data/catalog/JID_Catalog_Import_Manifest_2026-08-05.csv')
const rows = parseFounderSourceCsv(readFileSync(path, 'utf8'))

const regions = [...new Set(rows.map((r) => r.sourceRegion))].sort()
const sectors = [...new Set(rows.map((r) => r.sourceSector))].sort()

writeFileSync(
  join(process.cwd(), 'data/catalog/taxonomy-inventory.json'),
  JSON.stringify({ regions, sectors, regionCount: regions.length, sectorCount: sectors.length }, null, 2),
  'utf8',
)

console.log(`regions=${regions.length} sectors=${sectors.length}`)
