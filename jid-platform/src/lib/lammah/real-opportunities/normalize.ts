export function normalizeMatchingText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFKC')
    .replace(/[^0-9A-Za-z\u0600-\u06FF]+/g, ' ')
    .trim()
    .toLowerCase()
}

export function normalizeOpportunityTitle(value: string | null | undefined): string {
  return normalizeMatchingText(value)
}

export function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}
