/**
 * Generates supabase/seed/companies.sql — 1000+ synthetic catalog companies.
 * Run: pnpm tsx scripts/generate-companies-seed.ts
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const COUNT = 1050

const REGION_IDS = [
  'f2000001-0000-4000-8000-000000000001', // riyadh 35%
  'f2000001-0000-4000-8000-000000000005', // eastern 20%
  'f2000001-0000-4000-8000-000000000002', // makkah 20%
  'f2000001-0000-4000-8000-000000000003', // madinah
  'f2000001-0000-4000-8000-000000000004', // qassim
  'f2000001-0000-4000-8000-000000000006', // asir
  'f2000001-0000-4000-8000-000000000007', // tabuk
  'f2000001-0000-4000-8000-000000000008', // hail
  'f2000001-0000-4000-8000-000000000009', // northern
  'f2000001-0000-4000-8000-000000000010', // jazan
  'f2000001-0000-4000-8000-000000000011', // najran
  'f2000001-0000-4000-8000-000000000012', // bahah
  'f2000001-0000-4000-8000-000000000013', // jawf
] as const

const REGION_CITIES: Record<string, [string, string]> = {
  'f2000001-0000-4000-8000-000000000001': ['Riyadh', 'الرياض'],
  'f2000001-0000-4000-8000-000000000002': ['Jeddah', 'جدة'],
  'f2000001-0000-4000-8000-000000000003': ['Madinah', 'المدينة المنورة'],
  'f2000001-0000-4000-8000-000000000004': ['Buraydah', 'بريدة'],
  'f2000001-0000-4000-8000-000000000005': ['Dammam', 'الدمام'],
  'f2000001-0000-4000-8000-000000000006': ['Abha', 'أبها'],
  'f2000001-0000-4000-8000-000000000007': ['Tabuk', 'تبوك'],
  'f2000001-0000-4000-8000-000000000008': ['Hail', 'حائل'],
  'f2000001-0000-4000-8000-000000000009': ['Arar', 'عرعر'],
  'f2000001-0000-4000-8000-000000000010': ['Jazan', 'جازان'],
  'f2000001-0000-4000-8000-000000000011': ['Najran', 'نجران'],
  'f2000001-0000-4000-8000-000000000012': ['Al Bahah', 'الباحة'],
  'f2000001-0000-4000-8000-000000000013': ['Sakaka', 'سكاكا'],
}

/** Weighted region picker: Riyadh 35%, Eastern 20%, Makkah 20%, rest ~25%. */
function pickRegionIndex(i: number): number {
  const bucket = i % 100
  if (bucket < 35) return 0
  if (bucket < 55) return 1
  if (bucket < 75) return 2
  return 3 + (i % 10) // indices 3–12 across remaining regions
}

function pickOwnership(i: number): 'government' | 'semi_government' | 'private' {
  const bucket = i % 100
  if (bucket < 30) return 'government'
  if (bucket < 55) return 'semi_government'
  return 'private'
}

const PREFIXES_EN = [
  'Saudi',
  'National',
  'Gulf',
  'Kingdom',
  'United',
  'Al',
  'Eastern',
  'Riyadh',
  'Arabian',
  'Najd',
  'Hijazi',
  'Red Sea',
  'Desert',
  'Golden',
  'Future',
  'Vision',
  'Palm',
  'Oasis',
  'Crown',
  'Royal',
]

const CORES_EN = [
  'Tech',
  'Energy',
  'Logistics',
  'Healthcare',
  'Industrial',
  'Digital',
  'Mining',
  'Finance',
  'Construction',
  'Retail',
  'Aviation',
  'Maritime',
  'Education',
  'Consulting',
  'Insurance',
  'Agriculture',
  'Telecom',
  'Security',
  'Hospitality',
  'Manufacturing',
]

const SUFFIXES_EN = [
  'Company',
  'Group',
  'Holdings',
  'Corporation',
  'Enterprises',
  'Solutions',
  'Industries',
  'Partners',
  'Services',
  'Systems',
]

const PREFIXES_AR = [
  'السعودية',
  'الوطنية',
  'الخليج',
  'المملكة',
  'المتحدة',
  'الشرقية',
  'الرياض',
  'العربية',
  'النجد',
  'الحجاز',
  'البحر الأحمر',
  'الصحراء',
  'الذهبية',
  'المستقبل',
  'رؤية',
  'النخيل',
  'الواحة',
  'التاج',
  'الملكية',
]

const CORES_AR = [
  'للتقنية',
  'للطاقة',
  'للوجستيات',
  'للرعاية الصحية',
  'الصناعية',
  'الرقمية',
  'للتعدين',
  'المالية',
  'للمقاولات',
  'للتجزئة',
  'للطيران',
  'البحرية',
  'للتعليم',
  'للاستشارات',
  'للتأمين',
  'الزراعية',
  'للاتصالات',
  'للأمن',
  'للضيافة',
  'للتصنيع',
]

const SUFFIXES_AR = [
  'شركة',
  'مجموعة',
  'قابضة',
  'مؤسسة',
  'مشاريع',
  'حلول',
  'صناعات',
  'شركاء',
  'خدمات',
  'أنظمة',
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

function sectorId(i: number): string {
  const n = (i % 45) + 1
  return `f1000001-0000-4000-8000-${String(n).padStart(12, '0')}`
}

function companyUuid(i: number): string {
  return `f3000001-0000-4000-8000-${String(i).padStart(12, '0')}`
}

const rows: string[] = []

for (let i = 1; i <= COUNT; i++) {
  const regionId = REGION_IDS[pickRegionIndex(i)]!
  const [cityEn] = REGION_CITIES[regionId]!
  const ownership = pickOwnership(i)
  const prefixEn = PREFIXES_EN[i % PREFIXES_EN.length]!
  const coreEn = CORES_EN[(i * 3) % CORES_EN.length]!
  const suffixEn = SUFFIXES_EN[(i * 7) % SUFFIXES_EN.length]!
  const nameEn = `${prefixEn} ${coreEn} ${suffixEn} ${i}`
  const nameAr = `${SUFFIXES_AR[i % SUFFIXES_AR.length]!} ${PREFIXES_AR[(i * 2) % PREFIXES_AR.length]!} ${CORES_AR[(i * 5) % CORES_AR.length]!} ${i}`
  const slug = `${slugify(`${prefixEn}-${coreEn}-${suffixEn}`)}-${i}`
  const domain = `${slug}.jid-seed.local`
  const careerUrl = `https://careers.${slug}.sa`
  const websiteUrl = `https://www.${slug}.sa`
  const sector = sectorId(i)

  rows.push(`(
    '${companyUuid(i)}',
    '${escapeSql(nameEn)}',
    '${escapeSql(nameAr)}',
    ARRAY['${escapeSql(domain)}'],
    'company',
    'unclaimed',
    false,
    true,
    'pending'::public.link_status_enum,
    '${ownership}'::public.ownership_enum,
    '${sector}',
    '${regionId}',
    '${escapeSql(cityEn)}',
    '${escapeSql(slug)}',
    '${escapeSql(careerUrl)}',
    '${escapeSql(websiteUrl)}',
    '${escapeSql(`Leading ${coreEn.toLowerCase()} employer in ${cityEn}, Kingdom of Saudi Arabia.`)}',
    '${escapeSql(`جهة توظيف رائدة في قطاع ${CORES_AR[(i * 5) % CORES_AR.length]!} بمنطقة ${REGION_CITIES[regionId]![1]}.`)}'
  )`)
}

const sql = `-- DEVELOPMENT SEED DATA ONLY
-- Must be replaced with verified real entity list before production launch
--
-- Section 9 catalog: ${COUNT} synthetic companies for virtualization / performance testing.
-- Requires: seed/sectors.sql, seed/regions.sql, migration 044 (catalog columns).

INSERT INTO public.companies (
  id,
  name,
  name_ar,
  domains,
  entity_type,
  entity_state,
  is_verified,
  is_active,
  link_status,
  ownership_type,
  sector_id,
  region_id,
  city,
  slug,
  career_portal_url,
  website_url,
  description_en,
  description_ar
)
VALUES
${rows.join(',\n')}
ON CONFLICT (id) DO NOTHING;
`

const outPath = join(process.cwd(), 'supabase', 'seed', 'companies.sql')
writeFileSync(outPath, sql, 'utf8')
console.log(`Wrote ${COUNT} companies to ${outPath}`)
