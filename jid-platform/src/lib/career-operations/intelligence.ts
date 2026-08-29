import type { CareerIntelligenceInsight, CareerItem } from './types'

const LATIN_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'you',
  'your',
  'are',
  'was',
  'were',
  'will',
  'job',
  'role',
  'team',
  'work',
  'years',
  'year',
  'experience',
  'required',
  'requirements',
  'plus',
  'including',
  'about',
  'into',
  'over',
  'under',
  'within',
])

const ARABIC_STOPWORDS = new Set([
  'في',
  'من',
  'على',
  'إلى',
  'الى',
  'عن',
  'مع',
  'هذا',
  'هذه',
  'ذلك',
  'التي',
  'الذي',
  'او',
  'أو',
  'و',
  'ان',
  'أن',
  'وظيفة',
  'فرصة',
  'مطلوب',
  'خبرة',
  'عمل',
])

export function normalizeEvidenceToken(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[^A-Za-z0-9\u0600-\u06FF+#.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenizeOpportunityText(text: string): string[] {
  const tokens = text
    .split(/[^A-Za-z0-9\u0600-\u06FF+#]+/)
    .map((token) => normalizeEvidenceToken(token))
    .filter((token) => token.length >= 2)

  return tokens.filter((token) => !LATIN_STOPWORDS.has(token) && !ARABIC_STOPWORDS.has(token))
}

export function extractCareerRecordTokens(
  facts: ReadonlyArray<{ category: string; payload: Record<string, unknown> }>,
): string[] {
  const tokens: string[] = []
  for (const fact of facts) {
    const fields = [
      fact.payload.name,
      fact.payload.title,
      fact.payload.job_title,
      fact.payload.field_of_study,
      fact.payload.degree,
      fact.payload.skill,
    ]
    for (const field of fields) {
      if (typeof field === 'string' && field.trim()) {
        tokens.push(normalizeEvidenceToken(field))
      }
    }
    if (Array.isArray(fact.payload.skills)) {
      for (const skill of fact.payload.skills) {
        if (typeof skill === 'string' && skill.trim()) {
          tokens.push(normalizeEvidenceToken(skill))
        }
      }
    }
  }
  return tokens.filter(Boolean)
}

export function buildCareerIntelligenceInsights(input: {
  items: readonly CareerItem[]
  careerRecordTokens: readonly string[]
  timeWindowLabelAr: string
  timeWindowLabelEn: string
  now?: Date
}): CareerIntelligenceInsight[] {
  const population = input.items.filter(
    (item) => item.operational_state === 'considering' || item.origin === 'career_item',
  )
  const sourceItems = population.length > 0 ? population : input.items
  const counts = new Map<string, { count: number; examples: string[] }>()

  for (const item of sourceItems) {
    const text = [item.title_ar, item.title_en, item.organization_name].filter(Boolean).join(' ')
    const seen = new Set<string>()
    for (const token of tokenizeOpportunityText(text)) {
      if (seen.has(token)) continue
      seen.add(token)
      const current = counts.get(token) ?? { count: 0, examples: [] }
      current.count += 1
      const example = item.title_ar || item.title_en || item.organization_name
      if (example && current.examples.length < 3) current.examples.push(example)
      counts.set(token, current)
    }
  }

  const evidenced = new Set(input.careerRecordTokens.map(normalizeEvidenceToken).filter(Boolean))
  const insights: CareerIntelligenceInsight[] = []

  Array.from(counts.entries()).forEach(([token, value]) => {
    if (value.count < 2) return
    const inRecord = evidenced.has(token)
    insights.push({
      id: `insight:${token}`,
      token,
      occurrence_count: value.count,
      source_population: 'saved_or_considering_opportunities',
      source_population_size: sourceItems.length,
      evidenced_in_career_record: inRecord,
      evidence_examples: value.examples,
      missingness: inRecord ? 'evidenced' : 'not_evidenced',
      time_window: input.timeWindowLabelEn,
      statement_ar: inRecord
        ? `ظهرت «${token}» في ${value.count} من ${sourceItems.length} فرص محفوظة/قيد النظر. وهي موثّقة حالياً في السجل المهني.`
        : `ظهرت «${token}» في ${value.count} من ${sourceItems.length} فرص محفوظة/قيد النظر. وهي غير موثّقة حالياً في السجل المهني.`,
      statement_en: inRecord
        ? `"${token}" appeared in ${value.count} of ${sourceItems.length} saved/considering opportunities. It is currently evidenced in your Career Record.`
        : `"${token}" appeared in ${value.count} of ${sourceItems.length} saved/considering opportunities. It is not currently evidenced in your Career Record.`,
    })
  })

  return insights
    .sort((a, b) => {
      if (a.missingness !== b.missingness) {
        return a.missingness === 'not_evidenced' ? -1 : 1
      }
      return b.occurrence_count - a.occurrence_count
    })
    .slice(0, 8)
}
