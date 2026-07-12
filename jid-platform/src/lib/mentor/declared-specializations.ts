/** Ranked, deduplicated declared specialization tags (no computed metrics). */
export function buildMentorDeclaredSpecializations(input: {
  expertise_areas?: string[] | null
  specializations?: string[] | null
  expertise_sectors?: string[] | null
}): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []

  for (const source of [
    input.expertise_areas ?? [],
    input.specializations ?? [],
    input.expertise_sectors ?? [],
  ]) {
    for (const item of source) {
      const trimmed = item?.trim()
      if (!trimmed || seen.has(trimmed)) continue
      seen.add(trimmed)
      ordered.push(trimmed)
    }
  }

  return ordered
}
