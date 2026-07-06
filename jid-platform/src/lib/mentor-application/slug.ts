import { randomBytes } from 'node:crypto'

export function slugifyMentorName(fullName: string): string {
  const base = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  return base || 'mentor'
}

/** Section 4.2 — unique public slug from full_name + random suffix. */
export function generateMentorSlug(fullName: string): string {
  const suffix = randomBytes(3).toString('hex')
  return `${slugifyMentorName(fullName)}-${suffix}`
}
