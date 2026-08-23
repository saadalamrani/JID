/**
 * Wave A content-truth applicator. Isolated, catalog-only.
 * Run from jid-platform/: node scripts/content-wave-a-apply.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function load(locale) {
  return JSON.parse(readFileSync(join(root, 'messages', `${locale}.json`), 'utf8'))
}

function save(locale, data) {
  writeFileSync(join(root, 'messages', `${locale}.json`), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function keyFor(cursor, part) {
  if (Array.isArray(cursor) && /^\d+$/.test(part)) return Number(part)
  return part
}

function setPath(obj, path, value) {
  const parts = path.split('.')
  let cursor = obj
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = keyFor(cursor, parts[i])
    if (cursor[part] == null || typeof cursor[part] !== 'object') {
      throw new Error(`Missing path ${path} at ${parts.slice(0, i + 1).join('.')}`)
    }
    cursor = cursor[part]
  }
  const leaf = keyFor(cursor, parts[parts.length - 1])
  if (cursor[leaf] === undefined) {
    throw new Error(`Missing leaf ${path}`)
  }
  cursor[leaf] = value
}

const INDIC_MAP = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
}

function latinDigits(value) {
  return value.replace(/[٠-٩]/g, (d) => INDIC_MAP[d] ?? d)
}

function fixJari(value) {
  if (value.includes('صيانة جارية')) return value
  return value.replaceAll('جاري', 'جارٍ')
}

function walkStrings(node, fn) {
  if (typeof node === 'string') return fn(node)
  if (Array.isArray(node)) return node.map((item) => walkStrings(item, fn))
  if (node && typeof node === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(node)) {
      out[key] = walkStrings(value, fn)
    }
    return out
  }
  return node
}

const ar = load('ar')
const en = load('en')

const arSets = {
  'common.loading': 'جارٍ التحميل...',
  'publicShell.nav.catalog': 'الدليل',
  'publicShell.footer.groups.platform.catalog': 'الدليل',
  'smartHeader.commandPalette.actions.catalog': 'الدليل',
  'smartHeader.commandPalette.actions.cv': 'باني السيرة الذاتية',
  'profileDropdown.actions.cv': 'باني السيرة الذاتية',
  'profileDropdown.roles.company_admin': 'مسؤول منشأة',
  'landing.meta.description':
    'جِد هي منصة البنية التحتية المهنية في المملكة العربية السعودية — تربط الأفراد وجهات التوظيف والجامعات.',
  'landing.hero.eyebrow': 'البنية المهنية في السعودية',
  'landing.hero.body':
    'لكل طرف مساحته: الفرد لمسيرته، جهة التوظيف لحضورها، والجامعة لدورها المؤسسي ضمن حدود بياناتها.',
  'landing.hero.primaryCta': 'استكشف الفرص',
  'landing.hero.cards.groupAria': 'بطاقات النشاط على جِد',
  'landing.problem.cards.applicants.headline': 'المتقدمون',
  'landing.problem.cards.graduates.headline': 'الخريجون',
  'landing.modules.subtitle':
    'الأفراد وجهات التوظيف والجامعات على بنية تحتية مهنية واحدة — مع الفرص والدليل.',
  'landing.modules.items.catalog.title': 'الدليل',
  'landing.modules.items.catalog.description':
    'سجلات مرجعية تديرها المنصة لجهات التوظيف — منفصلة عن الملفات التعريفية المملوكة.',
  'landing.modules.items.universities.title': 'الجامعة',
  'landing.modules.items.universities.description':
    'حضور مؤسسي بعد التحقق وإنشاء الملف عمداً — منفصل عن سجل الدليل.',
  'landing.modules.items.cv.title': 'باني السيرة الذاتية',
  'landing.modules.items.cv.description': 'ابنِ سيرتك الذاتية وصدّرها بصيغة احترافية.',
  'landing.cta.entity.body':
    'لا يمكن إنشاء ملف جهة مباشرة كمسؤول — ابحث في الدليل، اطلب التحقق، ثم أنشئ ملفك التعريفي.',
  'catalogPage.hero.title': 'الدليل',
  'catalogPage.search.inputLabel': 'البحث في الدليل',
  'catalogPage.search.filtersLabel': 'فلاتر الدليل',
  'catalogPage.search.resultsLabel': 'نتائج الدليل',
  'catalogPage.detail.correctionIntro':
    'إذا كان لديك ملف تعريفي مرتبط بهذا السجل، يمكنك اقتراح تصحيح على بيانات الدليل.',
  'catalogPage.detail.backToCatalog': 'العودة إلى الدليل',
  'businessProfile.public.verified': 'منشور',
  'privacyPage.use.items.service':
    'تقديم الميزات الأساسية: الحسابات، الملفات، الفرص، رادار التقديمات، الإرشاد، والدليل.',
  'pulse.disabled.description': 'نبض المنصة غير متاح حالياً.',
  'pulse.placeholders.announcements': 'لوحة الإعلانات',
  'pulse.placeholders.metrics': 'مركز المقاييس',
  'pulse.placeholders.sectorTrends': 'طلب القطاعات',
  'pulse.placeholders.skillsTrends': 'طلب المهارات',
  'pulse.metrics.verified_profiles.label': 'ملفات تعريفية منشورة',
  'pulse.metrics.verified_profiles.caption': 'عدد الجهات التي نشرت ملفاً تعريفياً',
  'errors.notFoundPage.links.catalog': 'الدليل',
  'company.boost.teaserTitle': 'غير متاح في هذه النسخة',
  'company.boost.teaserBody': 'لا تُعرض خيارات الظهور المدفوع في النموذج الحالي.',
  'company.boost.toggleTitle': 'غير متاح',
  'company.boost.performance.title': 'غير متاح',
  'company.boost.performance.lift': 'لا تتوفر مؤشرات ظهور مدفوع في هذه النسخة.',
  'company.boost.performance.liftPending': 'لا تتوفر مؤشرات ظهور مدفوع في هذه النسخة.',
  'company.profileCreation.preview.verifiedBadge': 'منشور',
  'organizationProfile.publicationBoundary.message':
    'الملف في وضع المسودة وغير ظاهر للعامة. نشره لا يغيّر سجل الدليل.',
  'organizationProfile.universityPreview.verified': 'منشور',
  'university.profileCreation.preview.verifiedBadge': 'منشور',
  'university.nav.shellTitle': 'مساحة الجامعة',
  'university.nav.dashboard': 'مساحة الجامعة',
  'university.dashboard.title': 'مساحة الجامعة',
  'university.dashboard.mentorshipTitle': 'الإرشاد المهني',
  'university.dashboard.empty.title': 'البيانات المؤسسية غير متاحة حالياً',
  'university.dashboard.empty.description':
    'لن نعرض مؤشرات قبل أن تتوفر لها بيانات وصلاحيات واضحة.',
  'university.dashboard.consentGate.title': 'البيانات المؤسسية غير متاحة حالياً',
  'university.dashboard.consentGate.description':
    'لن نعرض مؤشرات قبل أن تتوفر لها بيانات وصلاحيات واضحة.',
  'university.dashboard.consentGate.methodologyTitle': 'حدود العرض',
  'university.dashboard.consentGate.methodologyBody':
    'لن نعرض مؤشرات قبل أن تتوفر لها بيانات وصلاحيات واضحة.',
  'university.dashboard.consentGate.nextAction':
    'يمكنك متابعة ملف الجامعة العام في الوقت الحالي.',
  'university.approvedWithoutProfile.title': 'تم التحقق من صفة التمثيل',
  'entity.approvedWithoutProfile.business.title': 'تم التحقق من صفة التمثيل',
  'entity.approvedWithoutProfile.university.title': 'تم التحقق من صفة التمثيل',
  'entity.wizard.entity.tabs.existing': 'اختر من الدليل',
  'staff.dashboard.unassignedQueue.subtitle': 'أقدم طلبات التحقق بانتظار التعيين',
  'staff.moderation.resolution.hideTodo': 'إخفاء المحتوى المبلَّغ عنه من القوائم العامة يتم عبر مسار المراجعة.',
  'staff.entities.subtitle': 'الشركات والجامعات — تصحيح بيانات الدليل فقط، وليس سير عمل التحقق.',
  'staff.entities.metadataForm.subtitle':
    'يمكن للموظف تصحيح حقول الدليل فقط. لا يمكن تغيير حالة الكيان من هنا.',
  'staff.lammah.review.claim': 'تعيين لي',
  'staff.lammah.detail.actions.claim': 'تعيين لي',
  'sys.entities.detail.actions.confirm.approveDescription':
    'اعتماد الجهة مباشرة مع تجاوز مراجعة الموظفين. يُسجَّل الإجراء في التدقيق.',
  'sys.entities.detail.fields.verified': 'التحقق',
  'sys.mentorApplications.staffNote': 'طابور الموظفين يعرض الطلبات بانتظار المراجعة فقط.',
  'profile.components.statsCompaniesViewed': 'نشاط الملف',
  'profile.components.statsTotalViews': 'نشاط الملف',
  'profile.components.statsDistinctCompanies30d': 'نشاط الملف',
  'profile.public.emptyStateTitle': 'ابدأ بملفك المهني',
  'profile.public.emptyStateMessage': 'أضف المعلومات التي تريد الاحتفاظ بها في جِد.',
  'profile.public.wizardSubtitle': 'أكمل المعلومات الأساسية لملفك.',
  'profile.public.completionBannerHint': 'أكمل الخطوات المتبقية في قائمتك.',
  'profile.company.public.unclaimedTitle': 'هل تمثّل هذه المنشأة؟',
  'profile.privacy.subtitle': 'تحكّم بمن يمكنه فتح ملفك على جِد.',
  'profile.privacy.visibilityDiscoverable': 'قابل للفتح برابط',
  'profile.privacy.visibilityDiscoverableHint':
    'هذا الإعداد لا يفعّل اكتشافاً من جهات التوظيف في النسخة الحالية.',
  'profile.privacy.visibilityPrivateHint':
    'أنت وفريق جِد فقط يمكنهم فتح ملفك من هنا.',
  'profile.privacy.showToCompanies': 'إظهار للشركات',
  'profile.privacy.showToCompaniesHint':
    'غير مفعّل كاكتشاف نشط في النسخة الحالية.',
  'settings.notifications.subtitle': 'تحكّم في قنوات استقبال التحديثات لكل نوع حدث.',
  'universities.discover.title': 'الجامعات',
  'universities.discover.subtitle': 'الحضور الجامعي على جِد يتم عبر الدليل والملف التعريفي المنشور.',
  'universities.discover.body':
    'لا تتوفر صفحة اكتشاف جامعات منفصلة حالياً. يمكنك تصفّح الدليل للاطلاع على السجلات المرجعية.',
  'universities.discover.catalogCta': 'فتح الدليل',
  'monetization.upgrade.checkoutUnavailable': 'الدفع غير متاح حالياً.',
  'monetization.upgrade.includedBullets.0': 'باني السيرة الذاتية',
  'monetization.upgrade.includedBullets.1': 'لمّاح — تغذية خارجية لباقة بلس',
  'monetization.upgrade.features.cv_pro_formats.headline': 'صدّر سيرتك بالصيغة المتاحة في خطتك.',
  'monetization.upgrade.features.lammah_feed.headline': 'اطلع على فرص خارجية مُدخلة إلى جِد.',
  'monetization.pricing.checkoutUnavailable': 'الدفع غير متاح حالياً.',
  'monetization.pricing.featureItems.0': 'باني السيرة الذاتية',
  'monetization.pricing.featureItems.1': 'لمّاح — تغذية خارجية لباقة بلس',
  'monetization.companyBilling.teaserBody': 'التفعيل المؤسسي يتم عبر فريق جِد عند توفره.',
  'monetization.companyBilling.teaserBullets.0': 'الرد على المتقدمين داخل جِد',
  'monetization.companyBilling.teaserBullets.1': 'الفحص الأولي للفرص',
  'monetization.companyBilling.teaserBullets.2': 'لا يشمل خيارات ظهور مدفوع في هذه النسخة',
  'monetization.staffBilling.companyIdPlaceholder': 'معرّف الجهة',
  'monetization.staffBilling.auditNote':
    'كل تفعيل يُسجَّل في سجل التدقيق. لا يوجد مسار كتابة مباشر على الاشتراكات من الواجهة.',
  'onboarding.individual.step1.description': 'ابدأ باسمك ورقم جوالك.',
  'onboarding.individual.step2.institutionHint': 'من الدليل.',
  'onboarding.entity.setup.description':
    'جهتك موجودة مسبقاً في دليل جِد. أضف الهوية البصرية ووصفاً تفصيلياً — لا نُنشئ جهة مكررة.',
  'onboarding.entity.setup.prefilledLabel': 'جهة من الدليل',
  'entity.wizard.verifyEmail.inbucketHint': 'إذا لم تصلك الرسالة، تحقق من مجلد البريد المزعج.',
  'terminology.directory': 'الدليل',
  'terminology.companyDirectory': 'الدليل',
  'terminology.universityDirectory': 'الدليل',
}

const enSets = {
  'publicShell.nav.catalog': 'Directory',
  'publicShell.footer.groups.platform.catalog': 'Directory',
  'smartHeader.commandPalette.actions.catalog': 'Directory',
  'smartHeader.commandPalette.actions.cv': 'CV Builder',
  'profileDropdown.actions.cv': 'CV Builder',
  'profileDropdown.roles.company_admin': 'Organization admin',
  'landing.meta.description':
    'JID is Saudi Arabia’s Career Infrastructure Platform — connecting individuals, employers, and universities.',
  'landing.hero.eyebrow': 'Saudi career infrastructure',
  'landing.hero.title': 'JID connects individuals, employers, and universities.',
  'landing.hero.body':
    'Each actor has a distinct space: the individual for a career, the employer for presence, and the university for its institutional role within clear data bounds.',
  'landing.hero.primaryCta': 'Explore opportunities',
  'landing.hero.cards.groupAria': 'JID activity cards',
  'landing.problem.cards.applicants.headline': 'Applicants',
  'landing.problem.cards.graduates.headline': 'Graduates',
  'landing.modules.subtitle':
    'Individuals, employers, and universities share one career infrastructure — with opportunities and the Directory.',
  'landing.modules.items.catalog.title': 'Directory',
  'landing.modules.items.catalog.description':
    'Platform-managed reference records for employers — separate from owned Profiles.',
  'landing.modules.items.universities.title': 'University',
  'landing.modules.items.universities.description':
    'Institutional presence after verification and deliberate Profile creation — separate from the Directory record.',
  'landing.modules.items.cv.title': 'CV Builder',
  'landing.modules.items.cv.description': 'Build your CV and export a professional snapshot.',
  'landing.cta.entity.body':
    'You cannot create an organization Profile as an admin shortcut — find the Directory record, request verification, then create your Profile.',
  'catalogPage.hero.title': 'Directory',
  'catalogPage.search.inputLabel': 'Search the Directory',
  'catalogPage.search.filtersLabel': 'Directory filters',
  'catalogPage.search.resultsLabel': 'Directory results',
  'catalogPage.detail.correctionIntro':
    'If you have an owned Profile linked to this record, you can suggest a Directory correction.',
  'catalogPage.detail.backToCatalog': 'Back to the Directory',
  'businessProfile.public.verified': 'Published',
  'privacyPage.use.items.service':
    'Providing core platform features: accounts, profiles, opportunities, application radar, mentorship, and the Directory.',
  'pulse.disabled.description': 'Platform Pulse is not available right now.',
  'pulse.placeholders.announcements': 'Announcements',
  'pulse.placeholders.metrics': 'Metrics',
  'pulse.placeholders.sectorTrends': 'Sector demand',
  'pulse.placeholders.skillsTrends': 'Skills demand',
  'pulse.metrics.verified_profiles.label': 'Published profiles',
  'pulse.metrics.verified_profiles.caption': 'Organizations that have published an owned Profile',
  'errors.notFoundPage.links.catalog': 'Directory',
  'company.boost.teaserTitle': 'Not available in this release',
  'company.boost.teaserBody': 'Paid visibility options are not shown in the current prototype.',
  'company.boost.toggleTitle': 'Not available',
  'company.boost.performance.title': 'Not available',
  'company.boost.performance.lift': 'Paid visibility metrics are not shown in this release.',
  'company.boost.performance.liftPending': 'Paid visibility metrics are not shown in this release.',
  'company.profileCreation.preview.verifiedBadge': 'Published',
  'organizationProfile.publicationBoundary.message':
    'This Profile is a draft and is not public. Publishing it does not change the Directory record.',
  'organizationProfile.universityPreview.verified': 'Published',
  'university.profileCreation.preview.verifiedBadge': 'Published',
  'university.nav.shellTitle': 'University workspace',
  'university.nav.dashboard': 'University workspace',
  'university.dashboard.title': 'University workspace',
  'university.dashboard.mentorshipTitle': 'Mentorship',
  'university.dashboard.empty.title': 'Institutional data is not available yet',
  'university.dashboard.empty.description':
    'We will not show indicators before their data and permissions are clear.',
  'university.dashboard.consentGate.title': 'Institutional data is not available yet',
  'university.dashboard.consentGate.description':
    'We will not show indicators before their data and permissions are clear.',
  'university.dashboard.consentGate.methodologyTitle': 'Display limits',
  'university.dashboard.consentGate.methodologyBody':
    'We will not show indicators before their data and permissions are clear.',
  'university.dashboard.consentGate.nextAction': 'You can continue with the public university Profile for now.',
  'university.approvedWithoutProfile.title': 'Representation has been verified',
  'entity.approvedWithoutProfile.business.title': 'Representation has been verified',
  'entity.approvedWithoutProfile.university.title': 'Representation has been verified',
  'entity.wizard.entity.tabs.existing': 'Choose from the Directory',
  'staff.dashboard.unassignedQueue.subtitle': 'Oldest verification requests waiting to be assigned',
  'staff.moderation.resolution.hideTodo':
    'Hiding reported content from public lists is handled through the review path.',
  'staff.entities.subtitle':
    'Companies and universities — Directory field corrections only, not the verification workflow.',
  'staff.entities.metadataForm.subtitle':
    'Staff may correct Directory fields only. The organization state cannot be changed here.',
  'staff.lammah.review.claim': 'Assign to me',
  'staff.lammah.detail.actions.claim': 'Assign to me',
  'sys.entities.detail.actions.confirm.approveDescription':
    'Approve the organization directly, bypassing staff review. The action is written to the audit log.',
  'sys.entities.detail.fields.verified': 'Verification',
  'sys.mentorApplications.staffNote': 'The staff queue shows applications awaiting review only.',
  'profile.components.statsCompaniesViewed': 'Profile activity',
  'profile.components.statsTotalViews': 'Profile activity',
  'profile.components.statsDistinctCompanies30d': 'Profile activity',
  'profile.public.emptyStateTitle': 'Start your professional profile',
  'profile.public.emptyStateMessage': 'Add the information you want to keep on JID.',
  'profile.public.wizardSubtitle': 'Complete the essential information on your profile.',
  'profile.public.completionBannerHint': 'Complete the remaining steps on your list.',
  'profile.company.public.unclaimedTitle': 'Do you represent this organization?',
  'profile.privacy.subtitle': 'Control who can open your profile on JID.',
  'profile.privacy.visibilityDiscoverable': 'Open via link',
  'profile.privacy.visibilityDiscoverableHint':
    'This setting does not turn on employer discovery in the current prototype.',
  'profile.privacy.visibilityPrivateHint': 'Only you and JID staff can open your profile from here.',
  'profile.privacy.showToCompanies': 'Show to companies',
  'profile.privacy.showToCompaniesHint': 'Not active as employer discovery in the current prototype.',
  'settings.notifications.subtitle': 'Choose how you receive updates for each event type.',
  'universities.discover.title': 'Universities',
  'universities.discover.subtitle': 'University presence on JID is through the Directory and a published Profile.',
  'universities.discover.body':
    'A separate university discovery page is not available. You can browse the Directory for reference records.',
  'universities.discover.catalogCta': 'Open the Directory',
  'monetization.upgrade.checkoutUnavailable': 'Checkout is not available right now.',
  'monetization.upgrade.includedBullets.0': 'CV Builder',
  'monetization.upgrade.includedBullets.1': 'Lammah — Plus external feed',
  'monetization.upgrade.features.cv_pro_formats.headline': 'Export CV formats available on your plan.',
  'monetization.upgrade.features.lammah_feed.headline': 'See verified external opportunities sourced into JID.',
  'monetization.pricing.checkoutUnavailable': 'Checkout is not available right now.',
  'monetization.pricing.featureItems.0': 'CV Builder',
  'monetization.pricing.featureItems.1': 'Lammah — Plus external feed',
  'monetization.companyBilling.teaserBody': 'Institutional activation is handled by the JID team when available.',
  'monetization.companyBilling.teaserBullets.0': 'Applicant replies inside JID',
  'monetization.companyBilling.teaserBullets.1': 'Initial opportunity screening',
  'monetization.companyBilling.teaserBullets.2': 'Paid visibility is not included in this prototype',
  'monetization.staffBilling.companyIdPlaceholder': 'Organization identifier',
  'monetization.staffBilling.auditNote':
    'Every activation is written to the audit log. There is no direct write path to subscriptions from this screen.',
  'onboarding.individual.step1.description': 'Start with your name and mobile number.',
  'onboarding.individual.step2.institutionHint': 'From the Directory.',
  'onboarding.entity.setup.description':
    'Your organization is already in the JID Directory. Add visual identity and a fuller description — we do not create a duplicate record.',
  'onboarding.entity.setup.prefilledLabel': 'Directory organization',
  'entity.wizard.verifyEmail.inbucketHint': 'If the message does not arrive, check your spam folder.',
  'terminology.directory': 'Directory',
  'terminology.companyDirectory': 'Directory',
  'terminology.universityDirectory': 'Directory',
}

function applySets(obj, sets) {
  for (const [path, value] of Object.entries(sets)) {
    setPath(obj, path, value)
  }
}

applySets(ar, arSets)
applySets(en, enSets)

function patchCvBuilder(node) {
  if (typeof node === 'string') {
    return node
      .replaceAll('منشئ السيرة الذاتية', 'باني السيرة الذاتية')
      .replaceAll('منشئ السيرة', 'باني السيرة الذاتية')
      .replaceAll('كتالوج الشركات', 'الدليل')
      .replaceAll('كتالوج الجامعات', 'الدليل')
      .replaceAll('كتالوج الجهات', 'الدليل')
      .replaceAll('من كتالوج الجامعات المعتمدة', 'من الدليل')
      .replaceAll('في كتالوج JID', 'في دليل جِد')
      .replaceAll('في الكتالوج', 'في الدليل')
      .replaceAll('حقول الكتالوج', 'حقول الدليل')
      .replaceAll('وكتالوجات الجهات', 'والدليل')
      .replaceAll('وكتالوجات موثوقة', '')
  }
  if (Array.isArray(node)) return node.map(patchCvBuilder)
  if (node && typeof node === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(node)) out[key] = patchCvBuilder(value)
    return out
  }
  return node
}

function patchEnCatalog(node) {
  if (typeof node === 'string') {
    return node
      .replaceAll('CV builder', 'CV Builder')
      .replaceAll('Build My CV', 'CV Builder')
      .replaceAll('Business catalogue', 'Directory')
      .replaceAll('entity catalogues', 'the Directory')
      .replaceAll('trusted catalogues', 'the Directory')
      .replaceAll('public catalogue', 'Directory')
  }
  if (Array.isArray(node)) return node.map(patchEnCatalog)
  if (node && typeof node === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(node)) out[key] = patchEnCatalog(value)
    return out
  }
  return node
}

const arPatched = walkStrings(patchCvBuilder(ar), (value) => latinDigits(fixJari(value)))
const enPatched = walkStrings(patchEnCatalog(en), (value) => value)

save('ar', arPatched)
save('en', enPatched)

console.log('Wave A catalog patches applied.')
