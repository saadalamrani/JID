/**
 * Safety gates for shareable / cloud test-account seeding.
 * Friend-facing fixtures must NEVER write to production.
 */

export const SEED_PASSWORD = 'JidSeed123!'

export const SEED_SQL_RELATIVE = 'supabase/seed/local-test-accounts.sql'

export const SEED_PREMIUM_SQL_RELATIVE = 'supabase/seed/shareable-test-premium-entitlements.sql'

/** Stable marker written into subscription provider_ref / billing_events. */
export const SHAREABLE_SEED_MARKER = 'JID_SHAREABLE_TEST_SEED_V2'

/** Only this Supabase project ref may receive shareable cloud seeds. */
export const ALLOWED_NONPROD_PROJECT_REF = 'hmjuijmaefajdjrjdsxu'

/** Production Supabase project ref — always refused. */
export const FORBIDDEN_PRODUCTION_PROJECT_REF = 'znfhladafpajyjwcfzvv'

/** Canonical friend-testing site URL for remote seed execute. */
export const EXPECTED_SHAREABLE_SITE_URL = 'https://jid-dev.vercel.app'

/** Allowed values for SEED_ENV when targeting a remote (or explicit local) database. */
export const ALLOWED_SEED_ENVS = [
  'nonprod',
  'staging',
  'preview',
  'test',
  'development',
  'local',
] as const

export type AllowedSeedEnv = (typeof ALLOWED_SEED_ENVS)[number]

export type SeedAccountRow = {
  portalAr: string
  loginPath: string
  email: string
  password: string
  statusAr: string
  premiumAr: string
  role: string
  shareWithFriends: boolean
  notes?: string
}

/** Architecture-correct share matrix (current routes + premium truth). */
export const SHAREABLE_TEST_ACCOUNTS: readonly SeedAccountRow[] = [
  {
    portalAr: 'بوابة الأفراد — ملف مكتمل',
    loginPath: '/login',
    email: 'individual-complete@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'فرد · ملف مكتمل · CV وتطبيقات',
    premiumAr: 'JID Plus (jid_plus) — seed/complimentary',
    role: 'individual',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الأفراد — مستخدم جديد',
    loginPath: '/login',
    email: 'individual-new@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'فرد · ملف غير مكتمل · تجربة الانضمام',
    premiumAr: 'JID Plus (jid_plus) — seed/complimentary',
    role: 'individual',
    shareWithFriends: true,
  },
  {
    portalAr: 'ملف المرشد',
    loginPath: '/login',
    email: 'mentor-approved@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'فرد + مرشد معتمد · /mentor/dashboard',
    premiumAr: 'JID Plus (jid_plus) — seed/complimentary',
    role: 'individual + mentor_profiles.approved',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الأعمال — موثقة ومدفوعة',
    loginPath: '/login',
    email: 'business-verified@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'company_admin · ملف أعمال مملوك · وظائف',
    premiumAr: 'Employer Premium (employer_premium) — seed/complimentary',
    role: 'company_admin',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الأعمال — بانتظار التحقق',
    loginPath: '/login',
    email: 'business-pending@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'entity · verification pending',
    premiumAr: 'employer_premium مسجّل للاختبار · الصلاحيات الموثّقة فقط تبقى محجوبة',
    role: 'entity',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الجامعات — موثقة ومدفوعة',
    loginPath: '/login',
    email: 'university-verified@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'university_admin · ملف جامعة مملوك',
    premiumAr: 'لا توجد خطة جامعية في Model 1 — غير مطبّق',
    role: 'university_admin',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الجامعات — بانتظار التحقق',
    loginPath: '/login',
    email: 'university-pending@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'entity · university pending',
    premiumAr: 'لا توجد خطة جامعية · التحقق معلّق',
    role: 'entity',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الموظفين — داخلي فقط',
    loginPath: '/staff/login',
    email: 'staff@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'staff · يتطلب MFA (AAL2)',
    premiumAr: 'داخلي — بدون اشتراك استهلاكي',
    role: 'staff',
    shareWithFriends: false,
    notes: 'Internal only — MFA enrollment required before shareable staff use',
  },
  {
    portalAr: 'لوحة الإدارة — داخلي فقط',
    loginPath: '/sys/login',
    email: 'admin@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'super_admin · يتطلب MFA',
    premiumAr: 'داخلي — بدون اشتراك استهلاكي',
    role: 'super_admin',
    shareWithFriends: false,
    notes: 'Internal only — MFA enrollment required',
  },
] as const

/** Plus / employer feature keys granted by the V2 premium seed (actual Model 1 keys). */
export const SHAREABLE_PREMIUM_MATRIX = [
  {
    email: 'individual-complete@jidseed.test',
    planKey: 'jid_plus',
    available: ['cv_pro_formats', 'search_for_me', 'lammah_feed'] as const,
    unavailable: [
      {
        key: 'smart_communication',
        reason: 'unavailable because actor is wrong (employer feature)',
      },
      {
        key: 'ssis',
        reason: 'unavailable because actor is wrong (employer feature)',
      },
      {
        key: 'priority_visibility',
        reason: 'unavailable because actor is wrong (employer feature)',
      },
    ],
  },
  {
    email: 'individual-new@jidseed.test',
    planKey: 'jid_plus',
    available: ['cv_pro_formats', 'search_for_me', 'lammah_feed'] as const,
    unavailable: [
      {
        key: 'smart_communication',
        reason: 'unavailable because actor is wrong (employer feature)',
      },
    ],
  },
  {
    email: 'mentor-approved@jidseed.test',
    planKey: 'jid_plus',
    available: ['cv_pro_formats', 'search_for_me', 'lammah_feed'] as const,
    unavailable: [
      {
        key: 'mentor_premium',
        reason: 'unavailable because not implemented (no mentor-specific plan key)',
      },
    ],
  },
  {
    email: 'business-verified@jidseed.test',
    planKey: 'employer_premium',
    available: ['smart_communication', 'ssis', 'priority_visibility'] as const,
    unavailable: [
      {
        key: 'cv_pro_formats',
        reason: 'unavailable because actor is wrong (JID Plus / individual)',
      },
      {
        key: 'jid_plus',
        reason: 'unavailable because product intentionally uses employer_premium for Business',
      },
    ],
  },
  {
    email: 'business-pending@jidseed.test',
    planKey: 'employer_premium',
    available: [] as const,
    unavailable: [
      {
        key: 'smart_communication',
        reason: 'unavailable because Verification is pending (no verified authority / dashboard)',
      },
      {
        key: 'ssis',
        reason: 'unavailable because Verification is pending',
      },
      {
        key: 'priority_visibility',
        reason: 'unavailable because Verification is pending',
      },
    ],
  },
  {
    email: 'university-verified@jidseed.test',
    planKey: null,
    available: [] as const,
    unavailable: [
      {
        key: 'university_premium',
        reason: 'unavailable because not implemented (no university plan in Model 1)',
      },
    ],
  },
  {
    email: 'university-pending@jidseed.test',
    planKey: null,
    available: [] as const,
    unavailable: [
      {
        key: 'university_premium',
        reason: 'unavailable because not implemented; Verification is pending',
      },
    ],
  },
  {
    email: 'staff@jidseed.test',
    planKey: null,
    available: [] as const,
    unavailable: [
      {
        key: 'jid_plus',
        reason: 'unavailable because product intentionally restricts staff from consumer plans',
      },
    ],
  },
  {
    email: 'admin@jidseed.test',
    planKey: null,
    available: [] as const,
    unavailable: [
      {
        key: 'jid_plus',
        reason: 'unavailable because product intentionally restricts super_admin from consumer plans',
      },
    ],
  },
] as const

export function isLocalDbUrl(url: string): boolean {
  try {
    const u = new URL(url.replace(/^postgresql:/i, 'http:').replace(/^postgres:/i, 'http:'))
    return (
      u.hostname === '127.0.0.1' ||
      u.hostname === 'localhost' ||
      u.hostname === '::1' ||
      u.hostname === 'host.docker.internal'
    )
  } catch {
    return /127\.0\.0\.1|localhost/.test(url)
  }
}

export function extractProjectRefFromSupabaseUrl(url: string | undefined): string | null {
  if (!url) return null
  const match = url.trim().match(/^https?:\/\/([a-z0-9]+)\.supabase\.co\/?$/i)
  return match?.[1]?.toLowerCase() ?? null
}

export function extractProjectRefFromDbUrl(dbUrl: string | undefined): string | null {
  if (!dbUrl) return null
  const direct = dbUrl.match(/([a-z0-9]{20})\.supabase\.co/i)
  if (direct?.[1]) return direct[1].toLowerCase()
  const poolerUser = dbUrl.match(/postgres\.([a-z0-9]{20})[:@]/i)
  if (poolerUser?.[1]) return poolerUser[1].toLowerCase()
  return null
}

export function looksLikeProductionTarget(params: {
  dbUrl?: string
  appUrl?: string
  siteUrl?: string
  supabaseUrl?: string
  appEnv?: string
  seedEnv?: string
}): string | null {
  const appEnv = (params.appEnv ?? '').toLowerCase()
  const seedEnv = (params.seedEnv ?? '').toLowerCase()

  if (appEnv === 'production' || seedEnv === 'production' || seedEnv === 'prod') {
    return 'APP_ENV/SEED_ENV marks this target as production'
  }

  const refs = [
    extractProjectRefFromSupabaseUrl(params.supabaseUrl),
    extractProjectRefFromDbUrl(params.dbUrl),
  ].filter(Boolean)

  if (refs.includes(FORBIDDEN_PRODUCTION_PROJECT_REF)) {
    return `Supabase project ref is production (${FORBIDDEN_PRODUCTION_PROJECT_REF})`
  }

  const haystack = [params.dbUrl, params.appUrl, params.siteUrl, params.supabaseUrl]
    .filter(Boolean)
    .join(' ')
  if (/jid\.sa/i.test(haystack)) {
    return 'URL references jid.sa (treated as production)'
  }
  if (/\bprod\b/i.test(haystack) && !/non[-_]?prod/i.test(haystack)) {
    return 'URL/host contains "prod" without an explicit nonprod marker'
  }

  return null
}

export function assertSeedEnvAllowed(seedEnv: string | undefined): AllowedSeedEnv {
  const value = (seedEnv ?? '').toLowerCase() as AllowedSeedEnv
  if (!ALLOWED_SEED_ENVS.includes(value)) {
    throw new Error(
      `SEED_ENV must be one of: ${ALLOWED_SEED_ENVS.join(', ')}. Got: ${seedEnv ?? '(unset)'}.`,
    )
  }
  return value
}

export function assertAllowedProjectRefs(params: {
  supabaseUrl?: string
  dbUrl?: string
}): void {
  const fromUrl = extractProjectRefFromSupabaseUrl(params.supabaseUrl)
  const fromDb = extractProjectRefFromDbUrl(params.dbUrl)

  if (!fromUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL must be https://<project-ref>.supabase.co for the allowed non-prod project.',
    )
  }
  if (fromUrl !== ALLOWED_NONPROD_PROJECT_REF) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL project ref must be exactly ${ALLOWED_NONPROD_PROJECT_REF}. Got: ${fromUrl}.`,
    )
  }
  if (fromDb && fromDb !== ALLOWED_NONPROD_PROJECT_REF) {
    throw new Error(
      `SEED_DATABASE_URL project ref must be exactly ${ALLOWED_NONPROD_PROJECT_REF}. Got: ${fromDb}.`,
    )
  }
  if (!fromDb && params.dbUrl && !isLocalDbUrl(params.dbUrl)) {
    // Pooler URLs sometimes omit the ref in the host; require explicit ref elsewhere.
    throw new Error(
      'SEED_DATABASE_URL must include the non-prod project ref (postgres.<ref> user or db.<ref>.supabase.co host).',
    )
  }
}

export function normalizeSiteUrl(siteUrl: string | undefined): string {
  return (siteUrl ?? '').trim().replace(/\/$/, '')
}

export function assertExpectedShareableSiteUrl(siteUrl: string | undefined): string {
  const normalized = normalizeSiteUrl(siteUrl)
  if (normalized !== EXPECTED_SHAREABLE_SITE_URL) {
    throw new Error(
      `SHAREABLE_TEST_SITE_URL must be exactly ${EXPECTED_SHAREABLE_SITE_URL}. Got: ${siteUrl ?? '(unset)'}.`,
    )
  }
  return normalized
}

export function assertPrivilegedDbCredential(dbUrl: string | undefined): string {
  if (!dbUrl || !dbUrl.trim()) {
    throw new Error(
      'Missing privileged server credential: SEED_DATABASE_URL (Postgres connection string for jid-nonprod).',
    )
  }
  return dbUrl
}

export function assertExecuteConfirmation(params: {
  execute: boolean
  confirmNonProd: boolean
}): void {
  if (params.execute && !params.confirmNonProd) {
    throw new Error('--execute requires --i-confirm-non-production')
  }
}

export function joinSiteLogin(siteUrl: string, loginPath: string): string {
  const base = siteUrl.replace(/\/$/, '')
  return `${base}${loginPath.startsWith('/') ? loginPath : `/${loginPath}`}`
}

export function formatArabicAccessTable(siteUrl: string): string {
  const header =
    '| البوابة | رابط الدخول | البريد | كلمة المرور | حالة الحساب | الوصول المميز |\n|---|---|---|---|---|---|'
  const rows = SHAREABLE_TEST_ACCOUNTS.map((row) => {
    const link = joinSiteLogin(siteUrl, row.loginPath)
    return `| ${row.portalAr} | ${link} | \`${row.email}\` | \`${row.password}\` | ${row.statusAr} | ${row.premiumAr} |`
  })
  return [header, ...rows].join('\n')
}

export function formatPremiumAccessMatrixMarkdown(): string {
  const header =
    '| الحساب | الخطة/الاستحقاق | المزايا المدفوعة المتاحة | المزايا غير المتاحة | سبب عدم الإتاحة |\n|---|---|---|---|---|'
  const rows = SHAREABLE_PREMIUM_MATRIX.map((row) => {
    const available = row.available.length > 0 ? row.available.join(', ') : '—'
    const unavailableKeys =
      row.unavailable.length > 0 ? row.unavailable.map((u) => u.key).join(', ') : '—'
    const reasons =
      row.unavailable.length > 0 ? row.unavailable.map((u) => u.reason).join('; ') : '—'
    return `| \`${row.email}\` | ${row.planKey ?? '—'} | ${available} | ${unavailableKeys} | ${reasons} |`
  })
  return [header, ...rows].join('\n')
}

export function formatWhatsAppMessage(siteUrl: string): string {
  const friendRows = SHAREABLE_TEST_ACCOUNTS.filter((r) => r.shareWithFriends)
  const lines = [
    'مرحباً — رابط تجربة منصة جِد (بيئة اختبار غير إنتاجية):',
    siteUrl.replace(/\/$/, ''),
    '',
    `كلمة المرور الموحدة: ${SEED_PASSWORD}`,
    '',
    'الحسابات الخارجية فقط:',
  ]

  for (const row of friendRows) {
    lines.push(`• ${row.portalAr}`)
    lines.push(`  الدخول: ${joinSiteLogin(siteUrl, row.loginPath)}`)
    lines.push(`  البريد: ${row.email}`)
    lines.push(`  الغرض: ${row.statusAr}`)
    lines.push(`  المميز: ${row.premiumAr}`)
    lines.push('')
  }

  lines.push('عند العثور على خلل، أرسل:')
  lines.push('البوابة / الحساب / الرابط / الجهاز والمتصفح / الخطوات / المتوقع / الذي حدث / صورة إن أمكن')
  lines.push('')
  lines.push('تحذير:')
  lines.push('- هذه بيئة اختبار — لا تدخل بيانات شخصية حقيقية.')
  lines.push('- لا تغيّر كلمة المرور ولا ترفع مستندات حساسة.')
  lines.push('- بوابتا الموظفين والإدارة داخلية وغير مشمولة هنا.')

  return lines.join('\n')
}

export function formatFounderInternalMessage(siteUrl: string): string {
  const internal = SHAREABLE_TEST_ACCOUNTS.filter((r) => !r.shareWithFriends)
  const lines = [
    'داخلي فقط — لا يُشارك بشكل عام',
    siteUrl.replace(/\/$/, ''),
    '',
    `كلمة المرور: ${SEED_PASSWORD}`,
    '',
  ]

  for (const row of internal) {
    lines.push(`• ${row.portalAr}`)
    lines.push(`  الدخول: ${joinSiteLogin(siteUrl, row.loginPath)}`)
    lines.push(`  البريد: ${row.email}`)
    lines.push(`  الحالة: ${row.statusAr}`)
    lines.push('  MFA: يلزم التسجيل اليدوي لـ TOTP (لا يوجد سر MFA مشترك في المستودع)')
    lines.push('')
  }

  lines.push('لا تُضعف MFA. لا تشارك هذه الحسابات في رسالة الأصدقاء.')
  return lines.join('\n')
}
