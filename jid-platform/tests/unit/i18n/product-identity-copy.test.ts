import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd(), 'messages')

function load(locale: 'ar' | 'en') {
  return JSON.parse(readFileSync(join(root, `${locale}.json`), 'utf8')) as Record<string, unknown>
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value)
    return out
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out)
    return out
  }
  if (value && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) {
      collectStrings(child, out)
    }
  }
  return out
}

const BANNED = [
  /Employment\s*&\s*Mentorship\s*Platform/i,
  /منصة التوظيف والإرشاد المهني/,
  /Claim this company/i,
  /claim your profile/i,
  /طالب بملفها/,
  /المطالبة بهذه الشركة/,
  /Job board/i,
  /لوحة الوظائف/,
  /متوافق مع PDPL/,
  /PDPL aligned/i,
  /Eight connected paths/i,
  /ثمانية مسارات/,
  /University directory/i,
  /دليل الجامعات/,
]

describe('active product identity copy', () => {
  for (const locale of ['ar', 'en'] as const) {
    it(`${locale} positioning and banned product phrasing`, () => {
      const messages = load(locale)
      const app = messages.app as { tagline?: string; description?: string }
      const strings = collectStrings(messages)

      if (locale === 'en') {
        expect(app.tagline).toMatch(/Career Infrastructure/i)
      } else {
        expect(app.tagline).toMatch(/البنية التحتية المهنية/)
      }

      for (const pattern of BANNED) {
        const hit = strings.find((s) => pattern.test(s))
        expect(hit, `banned pattern ${pattern} found: ${hit ?? ''}`).toBeUndefined()
      }
    })
  }
})
