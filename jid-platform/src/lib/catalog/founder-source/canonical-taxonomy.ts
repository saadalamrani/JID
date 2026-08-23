import type { CanonicalRegion, CanonicalSector } from './types'

/** Canonical JID regions — mirrors supabase/seed/regions.sql (all 13 administrative regions). */
export const CANONICAL_REGIONS: readonly CanonicalRegion[] = [
  { id: 'f2000001-0000-4000-8000-000000000001', slug: 'riyadh', nameEn: 'Riyadh', nameAr: 'الرياض' },
  { id: 'f2000001-0000-4000-8000-000000000002', slug: 'makkah', nameEn: 'Makkah', nameAr: 'مكة المكرمة' },
  { id: 'f2000001-0000-4000-8000-000000000003', slug: 'madinah', nameEn: 'Madinah', nameAr: 'المدينة المنورة' },
  { id: 'f2000001-0000-4000-8000-000000000004', slug: 'qassim', nameEn: 'Qassim', nameAr: 'القصيم' },
  {
    id: 'f2000001-0000-4000-8000-000000000005',
    slug: 'eastern-province',
    nameEn: 'Eastern Province',
    nameAr: 'المنطقة الشرقية',
  },
  { id: 'f2000001-0000-4000-8000-000000000006', slug: 'asir', nameEn: 'Asir', nameAr: 'عسير' },
  { id: 'f2000001-0000-4000-8000-000000000007', slug: 'tabuk', nameEn: 'Tabuk', nameAr: 'تبوك' },
  { id: 'f2000001-0000-4000-8000-000000000008', slug: 'hail', nameEn: 'Hail', nameAr: 'حائل' },
  {
    id: 'f2000001-0000-4000-8000-000000000009',
    slug: 'northern-borders',
    nameEn: 'Northern Borders',
    nameAr: 'الحدود الشمالية',
  },
  { id: 'f2000001-0000-4000-8000-000000000010', slug: 'jazan', nameEn: 'Jazan', nameAr: 'جازان' },
  { id: 'f2000001-0000-4000-8000-000000000011', slug: 'najran', nameEn: 'Najran', nameAr: 'نجران' },
  { id: 'f2000001-0000-4000-8000-000000000012', slug: 'al-bahah', nameEn: 'Al Bahah', nameAr: 'الباحة' },
  { id: 'f2000001-0000-4000-8000-000000000013', slug: 'al-jawf', nameEn: 'Al Jawf', nameAr: 'الجوف' },
] as const

/** Canonical JID sectors — mirrors supabase/seed/sectors.sql (45 Vision 2030 sectors). */
export const CANONICAL_SECTORS: readonly CanonicalSector[] = [
  { id: 'f1000001-0000-4000-8000-000000000001', slug: 'technology-information', nameEn: 'Technology & Information', nameAr: 'التقنية والمعلومات' },
  { id: 'f1000001-0000-4000-8000-000000000002', slug: 'energy-oil', nameEn: 'Energy & Oil', nameAr: 'الطاقة والبترول' },
  { id: 'f1000001-0000-4000-8000-000000000003', slug: 'healthcare', nameEn: 'Healthcare', nameAr: 'الرعاية الصحية' },
  { id: 'f1000001-0000-4000-8000-000000000004', slug: 'tourism-hospitality', nameEn: 'Tourism & Hospitality', nameAr: 'السياحة والضيافة' },
  { id: 'f1000001-0000-4000-8000-000000000005', slug: 'mining', nameEn: 'Mining', nameAr: 'التعدين' },
  { id: 'f1000001-0000-4000-8000-000000000006', slug: 'finance-banking', nameEn: 'Finance & Banking', nameAr: 'المالية والمصرفية' },
  { id: 'f1000001-0000-4000-8000-000000000007', slug: 'education', nameEn: 'Education', nameAr: 'التعليم' },
  { id: 'f1000001-0000-4000-8000-000000000008', slug: 'construction-real-estate', nameEn: 'Construction & Real Estate', nameAr: 'البناء والتطوير العقاري' },
  { id: 'f1000001-0000-4000-8000-000000000009', slug: 'transport-logistics', nameEn: 'Transport & Logistics', nameAr: 'النقل والخدمات اللوجستية' },
  { id: 'f1000001-0000-4000-8000-000000000010', slug: 'manufacturing', nameEn: 'Manufacturing', nameAr: 'التصنيع' },
  { id: 'f1000001-0000-4000-8000-000000000011', slug: 'entertainment-media', nameEn: 'Entertainment & Media', nameAr: 'الترفيه والإعلام' },
  { id: 'f1000001-0000-4000-8000-000000000012', slug: 'agriculture-food-security', nameEn: 'Agriculture & Food Security', nameAr: 'الزراعة والأمن الغذائي' },
  { id: 'f1000001-0000-4000-8000-000000000013', slug: 'environment-sustainability', nameEn: 'Environment & Sustainability', nameAr: 'البيئة والاستدامة' },
  { id: 'f1000001-0000-4000-8000-000000000014', slug: 'defense-security', nameEn: 'Defense & Security', nameAr: 'الدفاع والأمن' },
  { id: 'f1000001-0000-4000-8000-000000000015', slug: 'government-services', nameEn: 'Government Services', nameAr: 'الخدمات الحكومية' },
  { id: 'f1000001-0000-4000-8000-000000000016', slug: 'telecommunications', nameEn: 'Telecommunications', nameAr: 'الاتصالات' },
  { id: 'f1000001-0000-4000-8000-000000000017', slug: 'retail-ecommerce', nameEn: 'Retail & E-Commerce', nameAr: 'التجزئة والتجارة الإلكترونية' },
  { id: 'f1000001-0000-4000-8000-000000000018', slug: 'professional-services', nameEn: 'Professional Services & Consulting', nameAr: 'الخدمات المهنية والاستشارات' },
  { id: 'f1000001-0000-4000-8000-000000000019', slug: 'legal', nameEn: 'Legal', nameAr: 'القانون' },
  { id: 'f1000001-0000-4000-8000-000000000020', slug: 'human-resources', nameEn: 'Human Resources', nameAr: 'الموارد البشرية' },
  { id: 'f1000001-0000-4000-8000-000000000021', slug: 'sports', nameEn: 'Sports', nameAr: 'الرياضة' },
  { id: 'f1000001-0000-4000-8000-000000000022', slug: 'aerospace', nameEn: 'Aerospace', nameAr: 'الفضاء' },
  { id: 'f1000001-0000-4000-8000-000000000023', slug: 'artificial-intelligence', nameEn: 'Artificial Intelligence', nameAr: 'الذكاء الاصطناعي' },
  { id: 'f1000001-0000-4000-8000-000000000024', slug: 'finance-investment', nameEn: 'Finance & Investment', nameAr: 'التمويل والاستثمار' },
  { id: 'f1000001-0000-4000-8000-000000000025', slug: 'social-services', nameEn: 'Social Services', nameAr: 'الخدمات الاجتماعية' },
  { id: 'f1000001-0000-4000-8000-000000000026', slug: 'chemicals', nameEn: 'Chemicals', nameAr: 'الكيماويات' },
  { id: 'f1000001-0000-4000-8000-000000000027', slug: 'water-utilities', nameEn: 'Water & Utilities', nameAr: 'المياه والمرافق' },
  { id: 'f1000001-0000-4000-8000-000000000028', slug: 'insurance', nameEn: 'Insurance', nameAr: 'التأمين' },
  { id: 'f1000001-0000-4000-8000-000000000029', slug: 'pharmaceuticals', nameEn: 'Pharmaceuticals', nameAr: 'الأدوية والصيدلة' },
  { id: 'f1000001-0000-4000-8000-000000000030', slug: 'renewable-energy', nameEn: 'Renewable Energy', nameAr: 'الطاقة المتجددة' },
  { id: 'f1000001-0000-4000-8000-000000000031', slug: 'cybersecurity', nameEn: 'Cybersecurity', nameAr: 'الأمن السيبراني' },
  { id: 'f1000001-0000-4000-8000-000000000032', slug: 'biotechnology', nameEn: 'Biotechnology', nameAr: 'التقنية الحيوية' },
  { id: 'f1000001-0000-4000-8000-000000000033', slug: 'automotive', nameEn: 'Automotive', nameAr: 'السيارات' },
  { id: 'f1000001-0000-4000-8000-000000000034', slug: 'aviation', nameEn: 'Aviation', nameAr: 'الطيران' },
  { id: 'f1000001-0000-4000-8000-000000000035', slug: 'maritime-ports', nameEn: 'Maritime & Ports', nameAr: 'البحرية والموانئ' },
  { id: 'f1000001-0000-4000-8000-000000000036', slug: 'food-beverage', nameEn: 'Food & Beverage', nameAr: 'الأغذية والمشروبات' },
  { id: 'f1000001-0000-4000-8000-000000000037', slug: 'fashion-luxury', nameEn: 'Fashion & Luxury', nameAr: 'الأزياء والرفاهية' },
  { id: 'f1000001-0000-4000-8000-000000000038', slug: 'nonprofit-ngo', nameEn: 'Nonprofit & NGO', nameAr: 'المنظمات غير الربحية' },
  { id: 'f1000001-0000-4000-8000-000000000039', slug: 'research-development', nameEn: 'Research & Development', nameAr: 'البحث والتطوير' },
  { id: 'f1000001-0000-4000-8000-000000000040', slug: 'cloud-computing', nameEn: 'Cloud Computing', nameAr: 'الحوسبة السحابية' },
  { id: 'f1000001-0000-4000-8000-000000000041', slug: 'fintech', nameEn: 'Fintech', nameAr: 'التقنية المالية' },
  { id: 'f1000001-0000-4000-8000-000000000042', slug: 'smart-cities', nameEn: 'Smart Cities', nameAr: 'المدن الذكية' },
  { id: 'f1000001-0000-4000-8000-000000000043', slug: 'vocational-training', nameEn: 'Vocational Training', nameAr: 'التدريب المهني' },
  { id: 'f1000001-0000-4000-8000-000000000044', slug: 'public-administration', nameEn: 'Public Administration', nameAr: 'الإدارة العامة' },
  { id: 'f1000001-0000-4000-8000-000000000045', slug: 'heritage-culture', nameEn: 'Heritage & Culture', nameAr: 'التراث والثقافة' },
] as const

export function findCanonicalRegionBySlug(slug: string): CanonicalRegion | undefined {
  return CANONICAL_REGIONS.find((r) => r.slug === slug)
}

export function findCanonicalSectorBySlug(slug: string): CanonicalSector | undefined {
  return CANONICAL_SECTORS.find((s) => s.slug === slug)
}
