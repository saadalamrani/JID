/**
 * Wave 14 commercial packaging contract.
 * Exact SAR prices and final package names are not adopted. Catalog amounts in
 * `plans` remain operational/internal and must not be presented as public prices.
 */

export const COMMERCIAL_ACTORS = ['individual', 'business', 'university', 'government'] as const
export type CommercialActor = (typeof COMMERCIAL_ACTORS)[number]

export const COMMERCIAL_PACKAGE_KINDS = [
  'core_free',
  'paid_intelligence',
  'design_partner',
  'contract_only',
] as const
export type CommercialPackageKind = (typeof COMMERCIAL_PACKAGE_KINDS)[number]

export const PRICE_ADOPTION_STATUSES = ['not_adopted', 'adopted'] as const
export type PriceAdoptionStatus = (typeof PRICE_ADOPTION_STATUSES)[number]

export const PROHIBITED_COMMERCIAL_CLAIMS = [
  'pay_to_win_organic',
  'privacy_paywall',
  'job_guarantee',
  'data_sale',
  'fabricated_price',
  'government_endorsement',
] as const
export type ProhibitedCommercialClaim = (typeof PROHIBITED_COMMERCIAL_CLAIMS)[number]

export type CommercialPackage = {
  key: string
  actor: CommercialActor
  kind: CommercialPackageKind
  nameAr: string
  nameEn: string
  summaryAr: string
  summaryEn: string
  includesAr: readonly string[]
  includesEn: readonly string[]
  operationalPlanKey: string | null
  priceAdoptionStatus: PriceAdoptionStatus
  isPublic: boolean
  displayOrder: number
  excludedClaims: readonly ProhibitedCommercialClaim[]
}

const EXCLUDED: readonly ProhibitedCommercialClaim[] = PROHIBITED_COMMERCIAL_CLAIMS

export const COMMERCIAL_PACKAGES: readonly CommercialPackage[] = [
  {
    key: 'individual_core',
    actor: 'individual',
    kind: 'core_free',
    nameAr: 'الأساس للفرد',
    nameEn: 'Individual Core',
    summaryAr: 'السجل المهني، حقوق البيانات، اكتشاف الفرص، والمشاركة المهنية الأساسية تبقى مجانية.',
    summaryEn: 'Career Record, data rights, opportunity discovery, and core professional participation stay free.',
    includesAr: [
      'السجل المهني المعياري وضوابط الخصوصية',
      'اكتشاف الفرص الأساسية وتتبع رادار',
      'حقوق الوصول والتصحيح والتصدير والحذف',
    ],
    includesEn: [
      'Canonical Career Record and privacy controls',
      'Core opportunity discovery and Radar tracking',
      'Access, correction, export, and deletion rights',
    ],
    operationalPlanKey: null,
    priceAdoptionStatus: 'not_adopted',
    isPublic: true,
    displayOrder: 10,
    excludedClaims: EXCLUDED,
  },
  {
    key: 'jid_plus',
    actor: 'individual',
    kind: 'paid_intelligence',
    nameAr: 'جِد بلس',
    nameEn: 'JID Plus',
    summaryAr: 'ذكاء ومسار عمل متكرر للفرد بعد إثبات الفائدة. السعر غير معتمد بعد.',
    summaryEn: 'Recurring individual intelligence and workflow after proven utility. Price is not adopted yet.',
    includesAr: ['صيغ سيرة مهنية إضافية', 'تغذية لمّاح الخارجية عند توفر مصدر حقيقي'],
    includesEn: ['Additional professional CV formats', 'Lammah external feed when a real source exists'],
    operationalPlanKey: 'jid_plus',
    priceAdoptionStatus: 'not_adopted',
    isPublic: true,
    displayOrder: 20,
    excludedClaims: EXCLUDED,
  },
  {
    key: 'employer_starter',
    actor: 'business',
    kind: 'core_free',
    nameAr: 'بدء جهة التوظيف',
    nameEn: 'Employer Starter',
    summaryAr: 'مسار التوظيف الأساسي: الفرصة، المسار، التواصل، والمراجعة المنظمة.',
    summaryEn: 'Core hiring workflow: opportunity, pipeline, communication, and structured review.',
    includesAr: ['نشر الفرص الأصلية', 'مسار المتقدمين', 'مراجعة منظمة دون ترتيب مدفوع'],
    includesEn: ['Native opportunity publication', 'Applicant pipeline', 'Structured review without paid ranking'],
    operationalPlanKey: null,
    priceAdoptionStatus: 'not_adopted',
    isPublic: true,
    displayOrder: 30,
    excludedClaims: EXCLUDED,
  },
  {
    key: 'employer_growth',
    actor: 'business',
    kind: 'design_partner',
    nameAr: 'نمو جهة التوظيف',
    nameEn: 'Employer Growth',
    summaryAr: 'أدوار الفريق، الفحص، والتواصل المدعوم. التفعيل عبر شراكة تصميم أو مبيعات.',
    summaryEn: 'Team roles, screening, and assisted communication. Activation is design-partner or sales-led.',
    includesAr: ['التواصل داخل جِد', 'الفحص الأولي', 'حصّة ظهور مدفوع منفصلة عن الترتيب العضوي'],
    includesEn: [
      'In-platform communication',
      'Initial screening',
      'Labeled paid visibility separate from organic ranking',
    ],
    operationalPlanKey: 'employer_premium',
    priceAdoptionStatus: 'not_adopted',
    isPublic: true,
    displayOrder: 40,
    excludedClaims: EXCLUDED,
  },
  {
    key: 'employer_enterprise',
    actor: 'business',
    kind: 'contract_only',
    nameAr: 'عقد المؤسسات',
    nameEn: 'Employer Enterprise',
    summaryAr: 'عقد سنوي للحوكمة، التكامل، وبرامج التوظيف. ليس دفعاً ذاتياً.',
    summaryEn: 'Annual contract for governance, integrations, and hiring programs. Not self-serve checkout.',
    includesAr: ['صلاحيات أوسع للفريق', 'أساس التكامل (الموجة 13)', 'تفعيل يدوي مع سجل تدقيق'],
    includesEn: ['Broader team authority', 'Integration foundation (Wave 13)', 'Manual activation with an audit record'],
    operationalPlanKey: 'employer_enterprise',
    priceAdoptionStatus: 'not_adopted',
    isPublic: true,
    displayOrder: 50,
    excludedClaims: EXCLUDED,
  },
  {
    key: 'university_core',
    actor: 'university',
    kind: 'core_free',
    nameAr: 'أساس الجامعة',
    nameEn: 'University Core',
    summaryAr: 'الهوية، الانتماء، الأفواج، والتقارير المنهجية تبقى متاحة دون حاجز خصوصية مدفوع.',
    summaryEn: 'Identity, affiliation, cohorts, and methodology-visible reporting stay available without a privacy paywall.',
    includesAr: ['ملف الجامعة المملوك', 'الانتماء المعلن/الموثّق', 'تقارير التغطية والمنهجية'],
    includesEn: ['Owned university profile', 'Declared/verified affiliation', 'Coverage and methodology reports'],
    operationalPlanKey: null,
    priceAdoptionStatus: 'not_adopted',
    isPublic: true,
    displayOrder: 60,
    excludedClaims: EXCLUDED,
  },
  {
    key: 'university_readiness',
    actor: 'university',
    kind: 'design_partner',
    nameAr: 'جاهزية القياس',
    nameEn: 'University Readiness',
    summaryAr: 'عمل منهجي مدفوع لاكتشاف الجاهزية. ليس اشتراكاً منشوراً بسعر.',
    summaryEn: 'Paid methodology/readiness discovery work. Not a published-price subscription.',
    includesAr: ['مراجعة منهجية القياس', 'تحديد الفجوات في التغطية', 'اتفاق شراكة تصميم'],
    includesEn: ['Measurement methodology review', 'Coverage-gap identification', 'Design-partner agreement'],
    operationalPlanKey: null,
    priceAdoptionStatus: 'not_adopted',
    isPublic: true,
    displayOrder: 70,
    excludedClaims: EXCLUDED,
  },
  {
    key: 'university_outcomes',
    actor: 'university',
    kind: 'contract_only',
    nameAr: 'مساحة المخرجات',
    nameEn: 'Outcomes Workspace',
    summaryAr: 'عقد سنوي لمساحة الانتقال والمخرجات حسب نطاق الفوج/البرنامج.',
    summaryEn: 'Annual contract for the transition/outcomes workspace by cohort or program scope.',
    includesAr: ['مساحة تشغيل سنوية', 'تقارير مؤسسية بمنهجية ظاهرة', 'بدون ترتيب أو متوسط وطني مختلق'],
    includesEn: [
      'Annual operating workspace',
      'Institutional reports with visible methodology',
      'No fabricated ranking or national average',
    ],
    operationalPlanKey: 'university_outcomes',
    priceAdoptionStatus: 'not_adopted',
    isPublic: true,
    displayOrder: 80,
    excludedClaims: EXCLUDED,
  },
  {
    key: 'university_implementation',
    actor: 'university',
    kind: 'contract_only',
    nameAr: 'التنفيذ والربط',
    nameEn: 'Implementation',
    summaryAr: 'رسوم تنفيذ/ربط ظاهرة بشكل منفصل عن عقد المساحة السنوي.',
    summaryEn: 'Implementation or integration work, priced separately from the annual workspace contract.',
    includesAr: ['ربط البيانات عند وجود سلطة', 'تشغيل أولي', 'فاتورة منفصلة عن الاشتراك'],
    includesEn: ['Data linkage where authority exists', 'Initial operating setup', 'Invoice separate from subscription'],
    operationalPlanKey: null,
    priceAdoptionStatus: 'not_adopted',
    isPublic: true,
    displayOrder: 90,
    excludedClaims: EXCLUDED,
  },
  {
    key: 'government_contract',
    actor: 'government',
    kind: 'contract_only',
    nameAr: 'تعاقد حكومي',
    nameEn: 'Government contract',
    summaryAr: 'الحكومة ليست فاعلاً رابعاً في السوق. أي عمل يتم عبر عقد بصلاحية صريحة.',
    summaryEn: 'Government is not a fourth marketplace actor. Any work is contract-only with explicit authority.',
    includesAr: ['تعاقد بسلطة واضحة', 'لا بيع لبيانات الأفراد', 'لا إحصاء رسمي من المنصة'],
    includesEn: [
      'Contract with explicit authority',
      'No sale of individual data',
      'No official national statistics claim',
    ],
    operationalPlanKey: null,
    priceAdoptionStatus: 'not_adopted',
    isPublic: false,
    displayOrder: 100,
    excludedClaims: EXCLUDED,
  },
] as const

export function packagesForActor(actor: CommercialActor, options?: { includePrivate?: boolean }): CommercialPackage[] {
  return COMMERCIAL_PACKAGES.filter(
    (item) => item.actor === actor && (options?.includePrivate || item.isPublic),
  ).slice()
}

export function packageByKey(key: string): CommercialPackage | null {
  return COMMERCIAL_PACKAGES.find((item) => item.key === key) ?? null
}

export function packageByOperationalPlan(planKey: string): CommercialPackage | null {
  return COMMERCIAL_PACKAGES.find((item) => item.operationalPlanKey === planKey) ?? null
}

export function publicPriceIsAdopted(item: CommercialPackage): boolean {
  return item.priceAdoptionStatus === 'adopted'
}

export function assertPackagingInvariants(packages: readonly CommercialPackage[] = COMMERCIAL_PACKAGES): void {
  const keys = new Set<string>()
  for (const item of packages) {
    if (keys.has(item.key)) throw new Error(`duplicate_package:${item.key}`)
    keys.add(item.key)
    if (item.priceAdoptionStatus === 'adopted') {
      throw new Error(`price_adopted_without_founder_gate:${item.key}`)
    }
    for (const claim of PROHIBITED_COMMERCIAL_CLAIMS) {
      if (!item.excludedClaims.includes(claim)) {
        throw new Error(`missing_prohibited_claim_exclusion:${item.key}:${claim}`)
      }
    }
  }
}
