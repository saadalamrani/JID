import type { CvFullRecord } from '@/types/cv'

export type CanExportResult = {
  ok: boolean
  reasons: string[]
}

/** Section 7.11 — minimum fields required before PDF export. */
export function canExport(cv: CvFullRecord | undefined): CanExportResult {
  if (!cv) {
    return { ok: false, reasons: ['missing_cv'] }
  }

  const reasons: string[] = []

  if (!cv.full_name?.trim()) reasons.push('missing_full_name')
  if (!cv.email?.trim()) reasons.push('missing_email')
  if (!cv.education?.length) reasons.push('missing_education')
  if (!cv.experience?.length) reasons.push('missing_experience')

  return { ok: reasons.length === 0, reasons }
}

export function buildExportFilename(fullName: string): string {
  const safe = fullName
    .trim()
    .replace(/[^A-Za-z0-9\u0600-\u06FF\s_-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80)

  return `${safe || 'Resume'}_Resume.pdf`
}
