/**
 * Import official brand PNG masters → public/brand/*.png (transparent + dark variants).
 * Run: pnpm brand:import
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const ROOT = resolve(process.cwd())
const SOURCE_DIR = resolve(ROOT, 'scripts/brand-sources')
const OUTPUT_DIR = resolve(ROOT, 'public/brand')

const MASTERS = {
  en: resolve(SOURCE_DIR, 'logo_en_master.png'),
  ar: resolve(SOURCE_DIR, 'logo_ar_master.png'),
} as const

const BRAND = {
  olive: { r: 47, g: 58, b: 46 },
  gold: { r: 230, g: 180, b: 58 },
  beige: { r: 247, g: 245, b: 239 },
  cream: { r: 250, g: 246, b: 238 },
} as const

function colorDistance(
  r: number,
  g: number,
  b: number,
  target: { r: number; g: number; b: number },
): number {
  return Math.hypot(r - target.r, g - target.g, b - target.b)
}

function isBackground(r: number, g: number, b: number): boolean {
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  if (luminance > 215 && r > 200 && g > 195 && b > 175) return true
  if (colorDistance(r, g, b, BRAND.beige) < 45) return true
  if (colorDistance(r, g, b, BRAND.cream) < 50) return true
  return false
}

function isGoldAccent(r: number, g: number, b: number): boolean {
  return r > 175 && g > 125 && b < 120 && r > g && g > b
}

function isBrandInk(r: number, g: number, b: number): boolean {
  if (isGoldAccent(r, g, b)) return false
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  return luminance < 160 && g >= b
}

function processPixels(data: Buffer, mode: 'light' | 'dark'): Buffer {
  const out = Buffer.from(data)

  for (let i = 0; i < out.length; i += 4) {
    const r = out[i]!
    const g = out[i + 1]!
    const b = out[i + 2]!

    if (isBackground(r, g, b)) {
      out[i + 3] = 0
      continue
    }

    if (mode === 'dark' && isBrandInk(r, g, b)) {
      out[i] = BRAND.beige.r
      out[i + 1] = BRAND.beige.g
      out[i + 2] = BRAND.beige.b
    }

    out[i + 3] = 255
  }

  return out
}

async function exportLogo(
  masterPath: string,
  outputName: string,
  targetHeight: number,
  mode: 'light' | 'dark',
): Promise<void> {
  const { data, info } = await sharp(masterPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const processed = processPixels(data, mode)

  const outPath = resolve(OUTPUT_DIR, outputName)
  await sharp(processed, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .resize({ height: targetHeight, withoutEnlargement: false })
    .png({ compressionLevel: 6 })
    .toFile(outPath)

  const meta = await sharp(outPath).metadata()
  console.log(`Wrote ${outputName} (${meta.width}x${meta.height}, ${mode})`)
}

async function main(): Promise<void> {
  mkdirSync(SOURCE_DIR, { recursive: true })
  mkdirSync(OUTPUT_DIR, { recursive: true })

  readFileSync(MASTERS.en)
  readFileSync(MASTERS.ar)

  // Keep raw masters in public for debugging / fallback
  copyFileSync(MASTERS.ar, resolve(OUTPUT_DIR, 'logo_ar_master.png'))
  copyFileSync(MASTERS.en, resolve(OUTPUT_DIR, 'logo_en_master.png'))

  await exportLogo(MASTERS.en, 'logo_full_transparent.png', 64, 'light')
  await exportLogo(MASTERS.en, 'logo_full_white.png', 64, 'dark')
  await exportLogo(MASTERS.ar, 'logo_ar_transparent.png', 64, 'light')
  await exportLogo(MASTERS.ar, 'logo_ar_white.png', 64, 'dark')

  writeFileSync(
    resolve(SOURCE_DIR, 'README.md'),
    [
      '# Official brand masters',
      '',
      '- `logo_en_master.png` — English JID wordmark',
      '- `logo_ar_master.png` — Arabic جد wordmark',
      '- `logo_lockup_master.png` — Full lockup + tagline (reference)',
      '',
      'Regenerate: `pnpm brand:import`',
    ].join('\n'),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
