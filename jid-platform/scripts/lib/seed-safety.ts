/**
 * Safety gates for shareable / cloud test-account seeding.
 * Friend-facing fixtures must NEVER write to production.
 */

export const SEED_PASSWORD = 'JidSeed123!'

export const SEED_SQL_RELATIVE = 'supabase/seed/local-test-accounts.sql'

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
  role: string
  shareWithFriends: boolean
  notes?: string
}

/** Architecture-correct share matrix (current routes). */
export const SHAREABLE_TEST_ACCOUNTS: readonly SeedAccountRow[] = [
  {
    portalAr: 'بوابة الأفراد — ملف مكتمل',
    loginPath: '/login',
    email: 'individual-complete@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'فرد · ملف مكتمل · CV وتطبيقات',
    role: 'individual',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الأفراد — مستخدم جديد',
    loginPath: '/login',
    email: 'individual-new@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'فرد · ملف غير مكتمل · تجربة الانضمام',
    role: 'individual',
    shareWithFriends: true,
  },
  {
    portalAr: 'ملف المرشد',
    loginPath: '/login',
    email: 'mentor-approved@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'فرد + مرشد معتمد · /mentor/dashboard',
    role: 'individual + mentor_profiles.approved',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الأعمال — موثقة',
    loginPath: '/login',
    email: 'business-verified@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'company_admin · ملف أعمال مملوك · وظائف',
    role: 'company_admin',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الأعمال — بانتظار التحقق',
    loginPath: '/login',
    email: 'business-pending@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'entity · verification pending',
    role: 'entity',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الجامعات — موثقة',
    loginPath: '/login',
    email: 'university-verified@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'university_admin · ملف جامعة مملوك (مسارات الجامعة محدودة حالياً)',
    role: 'university_admin',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الجامعات — بانتظار التحقق',
    loginPath: '/login',
    email: 'university-pending@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'entity · university pending',
    role: 'entity',
    shareWithFriends: true,
  },
  {
    portalAr: 'بوابة الموظفين',
    loginPath: '/staff/login',
    email: 'staff@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'staff · يتطلب MFA (AAL2) — لا تشارك مع الأصدقاء قبل إعداد MFA',
    role: 'staff',
    shareWithFriends: false,
    notes: 'Internal only until MFA enrolled',
  },
  {
    portalAr: 'لوحة الإدارة',
    loginPath: '/sys/login',
    email: 'admin@jidseed.test',
    password: SEED_PASSWORD,
    statusAr: 'super_admin · يتطلب MFA — داخلي فقط',
    role: 'super_admin',
    shareWithFriends: false,
    notes: 'Internal only until MFA enrolled',
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

export function looksLikeProductionTarget(params: {
  dbUrl?: string
  appUrl?: string
  siteUrl?: string
  appEnv?: string
  seedEnv?: string
}): string | null {
  const appEnv = (params.appEnv ?? '').toLowerCase()
  const seedEnv = (params.seedEnv ?? '').toLowerCase()

  if (appEnv === 'production' || seedEnv === 'production' || seedEnv === 'prod') {
    return 'APP_ENV/SEED_ENV marks this target as production'
  }

  const haystack = [params.dbUrl, params.appUrl, params.siteUrl].filter(Boolean).join(' ')
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

export function joinSiteLogin(siteUrl: string, loginPath: string): string {
  const base = siteUrl.replace(/\/$/, '')
  return `${base}${loginPath.startsWith('/') ? loginPath : `/${loginPath}`}`
}

export function formatArabicAccessTable(siteUrl: string): string {
  const header =
    '| البوابة | رابط الدخول | البريد | كلمة المرور | حالة الحساب |\n|---|---|---|---|---|'
  const rows = SHAREABLE_TEST_ACCOUNTS.map((row) => {
    const link = joinSiteLogin(siteUrl, row.loginPath)
    return `| ${row.portalAr} | ${link} | \`${row.email}\` | \`${row.password}\` | ${row.statusAr} |`
  })
  return [header, ...rows].join('\n')
}

export function formatWhatsAppMessage(siteUrl: string): string {
  const friendRows = SHAREABLE_TEST_ACCOUNTS.filter((r) => r.shareWithFriends)
  const lines = [
    'مرحباً — هذا رابط تجربة منصة جِد (بيئة اختبار غير إنتاجية):',
    siteUrl.replace(/\/$/, ''),
    '',
    `كلمة المرور الموحدة لكل الحسابات التجريبية: ${SEED_PASSWORD}`,
    '',
    'الحسابات (للتجربة وجمع الملاحظات):',
  ]

  for (const row of friendRows) {
    lines.push(`• ${row.portalAr}`)
    lines.push(`  الدخول: ${joinSiteLogin(siteUrl, row.loginPath)}`)
    lines.push(`  البريد: ${row.email}`)
    lines.push('')
  }

  lines.push('ملاحظات سريعة:')
  lines.push('- جرّب التصفح بالعربية، سجّل أي خلل أو صعوبة في الاستخدام.')
  lines.push('- لا تغيّر كلمة المرور ولا ترفع بيانات حقيقية/حساسة.')
  lines.push('- بوابتا الموظفين والإدارة داخلية وتتطلب MFA — غير مشمولة في هذه الرسالة.')

  return lines.join('\n')
}
