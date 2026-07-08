/**
 * Batch 2 semantic token migration — staff + sys portals.
 * Run: pnpm tsx scripts/migrate-semantic-tokens-batch2.ts
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = join(process.cwd(), 'src')

const SCOPED_DIRS = [
  'app/[locale]/(staff)',
  'app/[locale]/(sys)',
  'components/staff',
]

const SCOPED_FILES = [
  'lib/staff/dev-test-access.ts',
  'lib/sys/dev-test-access.ts',
]

const REPLACEMENTS: Array<[RegExp, string]> = [
  // Strip redundant dark: jid overrides
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
  // Ink opacity ladder
  [/text-jid-ink\/80/g, 'text-muted-foreground'],
  [/text-jid-ink\/75/g, 'text-muted-foreground'],
  [/text-jid-ink\/70/g, 'text-muted-foreground'],
  [/text-jid-ink\/60/g, 'text-muted-foreground'],
  [/text-jid-ink\/55/g, 'text-muted-foreground'],
  [/text-jid-ink\/50/g, 'text-muted-foreground'],
  [/text-jid-ink\/45/g, 'text-muted-foreground'],
  [/text-jid-ink\/40/g, 'text-muted-foreground'],
  [/text-jid-ink\/35/g, 'text-muted-foreground'],
  [/text-jid-ink\/30/g, 'text-muted-foreground'],
  [/text-jid-ink/g, 'text-foreground'],
  // Backgrounds
  [/bg-jid-beige\/95/g, 'bg-background/95'],
  [/bg-jid-beige\/80/g, 'bg-muted'],
  [/bg-jid-beige\/70/g, 'bg-muted'],
  [/bg-jid-beige\/60/g, 'bg-muted'],
  [/bg-jid-beige\/40/g, 'bg-background/40'],
  [/bg-jid-beige\/30/g, 'bg-background/30'],
  [/bg-jid-beige/g, 'bg-background'],
  [/hover:bg-jid-beige\/80/g, 'hover:bg-muted'],
  [/hover:bg-jid-beige\/70/g, 'hover:bg-muted'],
  [/hover:bg-jid-beige\/60/g, 'hover:bg-muted'],
  // Olive / primary
  [/bg-jid-olive\/20/g, 'bg-primary/20'],
  [/bg-jid-olive\/15/g, 'bg-primary/15'],
  [/bg-jid-olive\/10/g, 'bg-primary/10'],
  [/bg-jid-olive\/90/g, 'bg-primary/90'],
  [/bg-jid-olive\/5/g, 'bg-primary/5'],
  [/hover:bg-jid-olive\/90/g, 'hover:bg-primary/90'],
  [/hover:bg-jid-olive/g, 'hover:bg-primary'],
  [/bg-jid-olive/g, 'bg-primary'],
  [/hover:text-jid-olive/g, 'hover:text-primary'],
  [/text-jid-olive/g, 'text-primary'],
  // Borders
  [/border-jid-ink\/10/g, 'border-border/60'],
  [/border-jid-ink\/20/g, 'border-border'],
  [/border-jid-line\/70/g, 'border-border'],
  [/border-jid-line\/60/g, 'border-border'],
  [/border-jid-gold\/\d+/g, 'border-border'],
  [/border-jid-olive\/20/g, 'border-primary/20'],
  [/border-jid-olive\/\d+/g, 'border-primary/25'],
  [/border-jid-olive/g, 'border-primary'],
  [/border-jid-line/g, 'border-border'],
  [/hover:border-jid-olive\/\d+/g, 'hover:border-primary/40'],
  // Gold / accent
  [/text-jid-gold/g, 'text-accent'],
  [/bg-jid-gold\/\d+/g, 'bg-accent/10'],
  [/hover:bg-jid-gold\/\d+/g, 'hover:bg-accent/90'],
  [/bg-jid-gold/g, 'bg-accent'],
  [/ring-jid-gold/g, 'ring-accent'],
  [/focus:ring-jid-gold/g, 'focus:ring-accent'],
  // Surfaces
  [/text-white/g, 'text-primary-foreground'],
  [/bg-white\/95/g, 'bg-card/95'],
  [/bg-white/g, 'bg-card'],
  [/from-jid-olive/g, 'from-primary'],
  [/to-jid-olive/g, 'to-primary'],
  [/from-jid-beige/g, 'from-background'],
  [/to-jid-beige/g, 'to-background'],
  [/via-jid-olive\/\d+/g, 'via-primary/10'],
  [/ring-jid-olive/g, 'ring-primary'],
  [/bg-jid-line\/\d+/g, 'bg-border/30'],
  [/text-jid-line/g, 'text-border'],
  [/text-jid-beige/g, 'text-primary-foreground'],
  [/bg-jid-ink\/\d+/g, 'bg-foreground/40'],
  [/bg-jid-ink/g, 'bg-foreground'],
  [/focus:ring-jid-olive/g, 'focus:ring-primary'],
  [/focus-visible:ring-jid-olive/g, 'focus-visible:ring-primary'],
  // Status colors — theme-aware via semantic danger/warning
  [/border-amber-200 bg-amber-50 text-amber-900/g, 'border-sem-warning/30 bg-sem-warning/10 text-sem-warning'],
  [/border-red-200 bg-red-50 text-red-800/g, 'border-destructive/30 bg-destructive/10 text-destructive'],
  [/text-red-700\/80/g, 'text-destructive/80'],
  [/text-red-700/g, 'text-destructive'],
  [/text-red-600 hover:bg-red-50 hover:text-red-700/g, 'text-destructive hover:bg-destructive/10 hover:text-destructive'],
  [/text-red-600/g, 'text-destructive'],
  [/hover:bg-red-50/g, 'hover:bg-destructive/10'],
  [/hover:text-red-700/g, 'hover:text-destructive'],
  [/bg-red-100 text-red-700/g, 'bg-destructive/10 text-destructive'],
  [/bg-red-100/g, 'bg-destructive/10'],
  [/text-red-800/g, 'text-destructive'],
  [/text-green-700/g, 'text-primary'],
  [/bg-green-100 text-green-800/g, 'bg-primary/10 text-primary'],
  [/bg-green-50/g, 'bg-primary/5'],
  [/text-green-600/g, 'text-primary'],
  [/divide-jid-line/g, 'divide-border'],
  [/accent-jid-olive/g, 'accent-primary'],
  [/bg-jid-line/g, 'bg-border'],
  [/bg-red-600/g, 'bg-destructive'],
  [/border-red-200 bg-red-50/g, 'border-destructive/30 bg-destructive/10'],
  [/border-red-500 bg-red-50/g, 'border-destructive bg-destructive/10'],
  [/border-2 border-red-500 bg-red-50/g, 'border-2 border-destructive bg-destructive/10'],
  [/border-red-500/g, 'border-destructive'],
  [/border-red-400/g, 'border-destructive/50'],
  [/border-red-300/g, 'border-destructive/40'],
  [/shadow-red-100/g, 'shadow-destructive/10'],
  [/bg-red-50\/40/g, 'bg-destructive/5'],
  [/bg-red-50/g, 'bg-destructive/10'],
  [/bg-red-500/g, 'bg-destructive'],
  [/text-red-900/g, 'text-destructive'],
  [/ring-red-200/g, 'ring-destructive/20'],
  [/border-amber-300 bg-amber-50/g, 'border-sem-warning/30 bg-sem-warning/10'],
  [/border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900/g, 'border border-sem-warning/30 bg-sem-warning/10 px-3 py-2 text-sm text-sem-warning'],
  [/border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900/g, 'border border-sem-warning/30 bg-sem-warning/10 px-3 py-2 text-xs text-sem-warning'],
  [/rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900/g, 'rounded-md border border-sem-warning/30 bg-sem-warning/10 px-3 py-2 text-sm text-sem-warning'],
  [/bg-amber-100 text-amber-800/g, 'bg-sem-warning/10 text-sem-warning'],
  [/text-amber-600/g, 'text-sem-warning'],
  [/text-amber-700/g, 'text-sem-warning'],
  [/text-amber-800/g, 'text-sem-warning'],
  [/text-amber-900/g, 'text-sem-warning'],
  [/bg-amber-500/g, 'bg-sem-warning'],
  [/bg-emerald-50 text-emerald-700/g, 'bg-primary/10 text-primary'],
  [/bg-emerald-100 text-emerald-800/g, 'bg-primary/10 text-primary'],
  [/text-emerald-700/g, 'text-primary'],
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
