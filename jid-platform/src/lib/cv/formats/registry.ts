/**
 * Model 1 CV format registry (Prompt 1).
 * Adding a format is a config task — wire document component + registry entry.
 */

export const CV_EXPORT_FORMATS = ['basic_free', 'harvard', 'global_ats'] as const

export type CvExportFormatKey = (typeof CV_EXPORT_FORMATS)[number]

/** Plus-gated pro formats — free users see teaser only. */
export const CV_PLUS_FORMATS = ['harvard', 'global_ats'] as const satisfies readonly CvExportFormatKey[]

export type CvPlusFormatKey = (typeof CV_PLUS_FORMATS)[number]

export const CV_EXPORT_LANGUAGES = ['en', 'ar', 'bilingual'] as const

export type CvExportLanguage = (typeof CV_EXPORT_LANGUAGES)[number]

export type CvFormatDefinition = {
  key: CvExportFormatKey
  labelAr: string
  labelEn: string
  descriptionAr: string
  descriptionEn: string
  tier: 'normal' | 'plus'
  /** Harvard convention is EN; AR routes to print-CSS engine. */
  supportsReactPdf: boolean
  defaultPageSize: 'LETTER' | 'A4'
}

export const CV_FORMAT_REGISTRY: Record<CvExportFormatKey, CvFormatDefinition> = {
  basic_free: {
    key: 'basic_free',
    labelAr: 'القالب الأساسي',
    labelEn: 'Basic template',
    descriptionAr: 'قالب مجاني بسيط — متاح للجميع.',
    descriptionEn: 'Simple free template — available to everyone.',
    tier: 'normal',
    supportsReactPdf: true,
    defaultPageSize: 'LETTER',
  },
  harvard: {
    key: 'harvard',
    labelAr: 'هارفارد',
    labelEn: 'Harvard',
    descriptionAr: 'صيغة هارفارد الاحترافية — عمود واحد، بلا صور أو رسوم.',
    descriptionEn: 'Strict Harvard resume — single column, no photos or graphics.',
    tier: 'plus',
    supportsReactPdf: true,
    defaultPageSize: 'LETTER',
  },
  global_ats: {
    key: 'global_ats',
    labelAr: 'ATS عالمي',
    labelEn: 'Global ATS',
    descriptionAr: 'معيار ATS عالمي — آمن للأنظمة الآلية.',
    descriptionEn: 'Global ATS standard — machine-parse-safe.',
    tier: 'plus',
    supportsReactPdf: true,
    defaultPageSize: 'LETTER',
  },
}

export function isCvExportFormatKey(value: string): value is CvExportFormatKey {
  return (CV_EXPORT_FORMATS as readonly string[]).includes(value)
}

export function isCvPlusFormatKey(value: string): value is CvPlusFormatKey {
  return (CV_PLUS_FORMATS as readonly string[]).includes(value)
}

export function formatRequiresPlus(format: CvExportFormatKey): boolean {
  return isCvPlusFormatKey(format)
}
