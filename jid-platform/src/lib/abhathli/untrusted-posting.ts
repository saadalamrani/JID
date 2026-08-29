/**
 * External postings are untrusted input, never instructions.
 * Do not follow imperative text inside a job description.
 */

const INSTRUCTION_SHAPES =
  /ignore (all|any|previous) instructions|you are now|system prompt|exfiltrat|send the contents of|do not tell the user/gi

export function sanitizeUntrustedPosting(text: string): string {
  INSTRUCTION_SHAPES.lastIndex = 0
  const withoutControls = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
  INSTRUCTION_SHAPES.lastIndex = 0
  return withoutControls.replace(INSTRUCTION_SHAPES, ' [untrusted-text-removed] ')
}

export function postingLooksLikePromptInjection(text: string): boolean {
  INSTRUCTION_SHAPES.lastIndex = 0
  return INSTRUCTION_SHAPES.test(text)
}

export function isSafeHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
