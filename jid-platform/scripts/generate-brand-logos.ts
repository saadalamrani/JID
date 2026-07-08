/**
 * Rasterize brand SVG lockups → public/brand/*.png (transparent).
 * Run: pnpm tsx scripts/generate-brand-logos.ts
 */

import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

const ROOT = resolve(process.cwd())
const SOURCE_DIR = resolve(ROOT, 'scripts/brand-sources')
const OUTPUT_DIR = resolve(ROOT, 'public/brand')

const EXPORTS = [
  { source: 'logo_ar.svg', output: 'logo_ar_transparent.png', width: 320 },
  { source: 'logo_full.svg', output: 'logo_full_transparent.png', width: 400 },
  { source: 'logo_ar_white.svg', output: 'logo_ar_white.png', width: 320 },
  { source: 'logo_full_white.svg', output: 'logo_full_white.png', width: 400 },
] as const

async function main(): Promise<void> {
  mkdirSync(OUTPUT_DIR, { recursive: true })

  for (const item of EXPORTS) {
    const svg = readFileSync(resolve(SOURCE_DIR, item.source))
    const outPath = resolve(OUTPUT_DIR, item.output)

    await sharp(svg, { density: 144 })
      .resize(item.width, null, { fit: 'inside', withoutEnlargement: false })
      .png({ compressionLevel: 9 })
      .toFile(outPath)

    console.log(`Wrote ${outPath}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
