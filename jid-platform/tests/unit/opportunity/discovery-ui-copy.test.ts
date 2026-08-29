import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd(), 'messages')

type OpportunitiesCopy = {
  board: { title: string }
  meta: { title: string }
  tabs: { native: string }
  legend: { noMatchPercent: string; title: string; native: string; external: string }
}

describe('Opportunity discovery copy', () => {
  it('uses Opportunity-first board titles in AR and EN', () => {
    const en = JSON.parse(readFileSync(join(root, 'en.json'), 'utf8')) as {
      opportunities: OpportunitiesCopy
    }
    const ar = JSON.parse(readFileSync(join(root, 'ar.json'), 'utf8')) as {
      opportunities: OpportunitiesCopy
    }

    expect(en.opportunities.board.title).toBe('Opportunities')
    expect(en.opportunities.meta.title).toBe('Opportunities')
    expect(en.opportunities.tabs.native).toBe('JID opportunities')
    expect(en.opportunities.legend.noMatchPercent.toLowerCase()).toContain('match percentage')

    expect(ar.opportunities.board.title).toBe('الفرص')
    expect(ar.opportunities.meta.title).toBe('الفرص')
    expect(ar.opportunities.tabs.native).toBe('فرص جِد')
    expect(ar.opportunities.legend.noMatchPercent).toContain('نسبة تطابق')
  })

  it('does not advertise match percentages or recommendation feeds in opportunity copy', () => {
    const en = JSON.parse(readFileSync(join(root, 'en.json'), 'utf8')) as {
      opportunities: OpportunitiesCopy
    }
    const ar = JSON.parse(readFileSync(join(root, 'ar.json'), 'utf8')) as {
      opportunities: OpportunitiesCopy
    }
    const enBlob = JSON.stringify(en.opportunities)
    const arBlob = JSON.stringify(ar.opportunities)
    expect(enBlob).not.toMatch(/Recommended for you|Match %|match score|trending/i)
    expect(arBlob).not.toMatch(/موصى به لك|رائج/)
    expect(en.opportunities.legend.noMatchPercent).toMatch(/no match percentage/i)
    expect(ar.opportunities.legend.noMatchPercent).toContain('لا توجد نسبة تطابق')
  })
})
