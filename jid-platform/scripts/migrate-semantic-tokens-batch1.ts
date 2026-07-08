/**
 * Batch 1 semantic token migration — public + individual modules.
 * Run: pnpm tsx scripts/migrate-semantic-tokens-batch1.ts
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = join(process.cwd(), 'src')

const SCOPED_DIRS = [
  'app/[locale]/(public)',
  'app/[locale]/(individual)',
  'app/[locale]/(mentor)',
  'app/[locale]/(onboarding)/individual',
  'app/[locale]/(onboarding)/_components',
  'app/[locale]/(auth)/signup',
  'components/profile',
  'components/notifications',
  'components/radar',
  'components/mentor',
  'components/auth',
  'components/shared',
]

const SCOPED_FILES = [
  'app/[locale]/(public)/layout.tsx',
  'app/[locale]/(onboarding)/layout.tsx',
]

const REPLACEMENTS: Array<[RegExp, string]> = [
  // Strip redundant dark: jid overrides (semantic tokens handle theme)
  [/\s*dark:text-jid-beige\/\d+/g, ''],
  [/\s*dark:text-jid-gold/g, ''],
  [/\s*dark:text-jid-beige/g, ''],
  [/\s*dark:bg-jid-olive\/\d+/g, ''],
  [/\s*dark:bg-jid-olive/g, ''],
  [/\s*dark:border-jid-gold\/\d+/g, ''],
  [/\s*dark:border-jid-line\/\d+/g, ''],
  [/\s*dark:hover:bg-jid-gold\/\d+/g, ''],
  [/\s*dark:hover:text-jid-gold/g, ''],
  [/\s*dark:hover:text-jid-beige/g, ''],
  // Semantic mappings
  [/text-jid-ink\/80/g, 'text-muted-foreground'],
  [/text-jid-ink\/70/g, 'text-muted-foreground'],
  [/text-jid-ink\/60/g, 'text-muted-foreground'],
  [/text-jid-ink\/50/g, 'text-muted-foreground'],
  [/text-jid-ink\/45/g, 'text-muted-foreground'],
  [/text-jid-ink/g, 'text-foreground'],
  [/bg-jid-beige\/95/g, 'bg-background/95'],
  [/bg-jid-beige\/60/g, 'bg-muted'],
  [/bg-jid-beige\/40/g, 'bg-background/40'],
  [/bg-jid-beige/g, 'bg-background'],
  [/bg-jid-olive\/10/g, 'bg-primary/10'],
  [/bg-jid-olive\/90/g, 'bg-primary/90'],
  [/bg-jid-olive\/5/g, 'bg-primary/5'],
  [/hover:bg-jid-olive\/90/g, 'hover:bg-primary/90'],
  [/hover:bg-jid-olive/g, 'hover:bg-primary'],
  [/bg-jid-olive/g, 'bg-primary'],
  [/hover:text-jid-olive/g, 'hover:text-primary'],
  [/text-jid-olive/g, 'text-primary'],
  [/border-jid-line\/70/g, 'border-border'],
  [/border-jid-line\/60/g, 'border-border'],
  [/border-jid-gold\/\d+/g, 'border-border'],
  [/border-jid-line/g, 'border-border'],
  [/text-jid-gold/g, 'text-accent'],
  [/bg-jid-gold\/\d+/g, 'bg-accent/10'],
  [/hover:bg-jid-gold\/\d+/g, 'hover:bg-accent/90'],
  [/bg-jid-gold/g, 'bg-accent'],
  [/ring-jid-gold/g, 'ring-accent'],
  [/focus:ring-jid-gold/g, 'focus:ring-accent'],
  [/text-white/g, 'text-primary-foreground'],
  [/bg-white\/95/g, 'bg-card/95'],
  [/bg-white/g, 'bg-card'],
  [/from-jid-olive/g, 'from-primary'],
  [/to-jid-olive/g, 'to-primary'],
  [/from-jid-beige/g, 'from-background'],
  [/to-jid-beige/g, 'to-background'],
  [/via-jid-olive\/\d+/g, 'via-primary/10'],
  [/ring-jid-olive/g, 'ring-primary'],
  [/border-jid-olive\/\d+/g, 'border-primary/25'],
  [/border-jid-olive/g, 'border-primary'],
  [/hover:border-jid-olive\/\d+/g, 'hover:border-primary/40'],
  [/bg-jid-line\/\d+/g, 'bg-border/30'],
  [/text-jid-line/g, 'text-border'],
  [/text-jid-beige/g, 'text-primary-foreground'],
  [/bg-jid-ink\/\d+/g, 'bg-foreground/40'],
  [/bg-jid-ink/g, 'bg-foreground'],
  [/text-foreground-500/g, 'text-muted-foreground'],
  [/hover:bg-primary-600/g, 'hover:bg-primary/90'],
  [/active:bg-primary-700/g, 'active:bg-primary/80'],
  [/bg-primary-600/g, 'bg-primary/90'],
  [/focus:ring-jid-olive/g, 'focus:ring-primary'],
  [/focus-visible:ring-jid-olive/g, 'focus-visible:ring-primary'],
  [/dark:hover:bg-primary/g, 'hover:bg-surface'],
]

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full, files)
    } else if (extname(full) === '.tsx' || extname(full) === '.ts') {
      files.push(full)
    }
  }
  return files
}

function migrateFile(filePath: string): boolean {
  let content = readFileSync(filePath, 'utf8')
  const original = content
  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement)
  }
  if (content !== original) {
    writeFileSync(filePath, content, 'utf8')
    return true
  }
  return false
}

function main(): void {
  const files = new Set<string>()

  for (const rel of SCOPED_DIRS) {
    const abs = join(ROOT, rel)
    try {
      for (const f of walk(abs)) files.add(f)
    } catch {
      console.warn(`Skip missing dir: ${rel}`)
    }
  }

  for (const rel of SCOPED_FILES) {
    files.add(join(ROOT, rel))
  }

  let changed = 0
  for (const file of files) {
    if (migrateFile(file)) {
      changed++
      console.log('updated:', file.replace(ROOT + '\\', '').replace(ROOT + '/', ''))
    }
  }

  console.log(`\nMigrated ${changed} files.`)
}

main()
