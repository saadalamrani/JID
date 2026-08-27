import type { Locale } from '@/lib/i18n/config'
import type { CvProjectionSectionKey } from './operations'

export type CvProjectionCopy = {
  metaTitle: string
  title: string
  description: string
  identityTitle: string
  cvTitle: string
  cvSummary: string
  language: string
  template: string
  arabic: string
  english: string
  include: string
  exclude: string
  included: string
  excluded: string
  moveUp: string
  moveDown: string
  sectionOrder: string
  itemOrder: string
  presentationWording: string
  presentationHint: string
  displayTitle: string
  presentationSummary: string
  correctFact: string
  correctFactSeam: string
  preview: string
  previewEmpty: string
  shareTitle: string
  sharePrivate: string
  shareAwaiting: string
  shareAuthorized: string
  requestShare: string
  shareUnavailable: string
  shareBlockedSuccess: string
  inRecord: string
  inThisCv: string
  sharedWithRecipient: string
  scopesHint: string
  privateDefault: string
  loading: string
  emptyTitle: string
  emptyDescription: string
  openCareerRecord: string
  errorTitle: string
  errorMessage: string
  retry: string
  forbiddenTitle: string
  forbiddenMessage: string
  unavailableTitle: string
  unavailableMessage: string
  staleTitle: string
  staleMessage: string
  close: string
  savePresentation: string
  cancel: string
  noEvidenceTitle: string
  untitled: string
  section: Record<CvProjectionSectionKey, string>
}

const ar: CvProjectionCopy = {
  metaTitle: 'السيرة الذاتية',
  title: 'السيرة الذاتية',
  description:
    'نسخة تختار ما يظهر فيها من سجلك المهني، وترتبها وتصوغ عرضها لغرض معين. تعديل العرض لا يغيّر المعلومة في السجل.',
  identityTitle: 'هوية هذه السيرة',
  cvTitle: 'عنوان السيرة',
  cvSummary: 'ملخص هذه السيرة',
  language: 'لغة السيرة',
  template: 'القالب',
  arabic: 'العربية',
  english: 'الإنجليزية',
  include: 'إضافة إلى هذه السيرة',
  exclude: 'إزالة من هذه السيرة',
  included: 'مضاف إلى هذه السيرة',
  excluded: 'غير مضاف إلى هذه السيرة',
  moveUp: 'تحريك للأعلى',
  moveDown: 'تحريك للأسفل',
  sectionOrder: 'ترتيب الأقسام',
  itemOrder: 'ترتيب العناصر',
  presentationWording: 'تعديل',
  presentationHint: 'تعديل العرض يخص هذه السيرة فقط، ولا يصحّح المعلومة في السجل المهني.',
  displayTitle: 'عنوان العرض في هذه السيرة',
  presentationSummary: 'صياغة العرض في هذه السيرة',
  correctFact: 'تصحيح المعلومة',
  correctFactSeam: 'تصحيح المعلومة يتم في السجل المهني، وليس بنسخة محلية داخل السيرة.',
  preview: 'معاينة',
  previewEmpty: 'لا يوجد محتوى مختار لمعاينته في هذه السيرة.',
  shareTitle: 'حالة المشاركة',
  sharePrivate: 'هذه السيرة خاصة.',
  shareAwaiting: 'طلب المشاركة ينتظر تخويلاً معتمداً. لم تُنفَّذ مشاركة.',
  shareAuthorized: 'مشاركة مصرّح بها للمستلم والغرض المحددين.',
  requestShare: 'طلب مشاركة مع جهة',
  shareUnavailable: 'المشاركة مع جهة تتطلب تخويلاً معتمداً، وهي غير متاحة حتى ربط الخدمة الأساسية.',
  shareBlockedSuccess: 'لا يمكن اعتبار المشاركة مكتملة من الواجهة وحدها.',
  inRecord: 'موجود في سجلي المهني',
  inThisCv: 'مضاف إلى هذه السيرة',
  sharedWithRecipient: 'مشارك مع جهة أو مستلم',
  scopesHint: 'هذه ثلاث حالات مختلفة. لا تعني إحداها الأخرى.',
  privateDefault:
    'خاص افتراضياً. اختيار عنصر للسيرة لا يجعله عاماً، ولا يطلع جهة التوظيف أو الجامعة.',
  loading: 'جارٍ تحميل السيرة',
  emptyTitle: 'لا توجد سيرة بعد',
  emptyDescription: 'أنشئ سيرة من سجلك المهني بعد ربط الخدمة، أو أضف معلومات للسجل أولاً.',
  openCareerRecord: 'فتح السجل المهني',
  errorTitle: 'تعذّر تحميل السيرة',
  errorMessage: 'لم نتمكن من جلب هذه السيرة. أعد المحاولة.',
  retry: 'إعادة المحاولة',
  forbiddenTitle: 'لا يمكن عرض هذه السيرة',
  forbiddenMessage: 'هذه السيرة غير متاحة لحسابك.',
  unavailableTitle: 'السيرة الذاتية غير متاحة حالياً',
  unavailableMessage:
    'تركيب السيرة من السجل المهني ينتظر ربط الخدمة الأساسية. لم نعرض سيرة تجريبية مكانها.',
  staleTitle: 'معاينة السيرة أقدم من مصدرها',
  staleMessage: 'قد لا تعكس هذه المعاينة أحدث مراجعة في السجل المهني.',
  close: 'إغلاق',
  savePresentation: 'حفظ العرض',
  cancel: 'إلغاء',
  noEvidenceTitle: 'لا توجد معلومات في السجل لإضافتها',
  untitled: 'سيرة بلا عنوان',
  section: {
    HEADER: 'الترويسة',
    SUMMARY: 'الملخص',
    EXPERIENCE: 'الخبرة',
    EDUCATION: 'التعليم',
    SKILLS: 'المهارات',
    CREDENTIALS: 'الشهادات',
    PROJECTS: 'المشاريع',
    AWARDS: 'الجوائز',
    LANGUAGES: 'اللغات',
    VOLUNTEERING: 'العمل التطوعي',
    PUBLICATIONS: 'المنشورات',
    OTHER: 'أخرى',
  },
}

const en: CvProjectionCopy = {
  metaTitle: 'CV',
  title: 'CV',
  description:
    'A copy you compose from your Career Record: choose what appears, order it, and word the presentation for a purpose. Presentation edits do not change the underlying fact.',
  identityTitle: 'This CV',
  cvTitle: 'CV title',
  cvSummary: 'CV summary',
  language: 'CV language',
  template: 'Template',
  arabic: 'Arabic',
  english: 'English',
  include: 'Add to this CV',
  exclude: 'Remove from this CV',
  included: 'Included in this CV',
  excluded: 'Not included in this CV',
  moveUp: 'Move up',
  moveDown: 'Move down',
  sectionOrder: 'Section order',
  itemOrder: 'Item order',
  presentationWording: 'Edit presentation',
  presentationHint:
    'Presentation wording applies only to this CV. It does not correct the Career Record fact.',
  displayTitle: 'Display title on this CV',
  presentationSummary: 'Presentation wording on this CV',
  correctFact: 'Correct the fact',
  correctFactSeam:
    'Fact correction happens in the Career Record, not as a duplicate local CV fact.',
  preview: 'Preview',
  previewEmpty: 'No selected content is available to preview on this CV.',
  shareTitle: 'Sharing state',
  sharePrivate: 'This CV is private.',
  shareAwaiting: 'A share request is waiting for an authorized grant. No share has been completed.',
  shareAuthorized: 'Authorized sharing for the stated recipient and purpose.',
  requestShare: 'Request share with a recipient',
  shareUnavailable:
    'Sharing with a recipient requires an authorized grant and is unavailable until the core service is bound.',
  shareBlockedSuccess: 'The interface alone cannot treat a share as completed.',
  inRecord: 'In my Career Record',
  inThisCv: 'Added to this CV',
  sharedWithRecipient: 'Shared with a recipient',
  scopesHint: 'These are three different states. One does not imply the others.',
  privateDefault:
    'Private by default. Selecting an item for a CV does not make it public, and does not give an employer or university access.',
  loading: 'Loading CV',
  emptyTitle: 'No CV yet',
  emptyDescription:
    'Compose a CV from your Career Record after the core service is bound, or add record information first.',
  openCareerRecord: 'Open Career Record',
  errorTitle: 'Could not load this CV',
  errorMessage: 'This CV could not be retrieved. Try again.',
  retry: 'Try again',
  forbiddenTitle: 'This CV cannot be shown',
  forbiddenMessage: 'This CV is not available to your account.',
  unavailableTitle: 'CV composition is not available yet',
  unavailableMessage:
    'Composing a CV from the Career Record waits for the core service to be bound. No sample CV is shown in its place.',
  staleTitle: 'This CV preview is older than its source',
  staleMessage: 'This preview may not reflect the latest Career Record revision.',
  close: 'Close',
  savePresentation: 'Save presentation',
  cancel: 'Cancel',
  noEvidenceTitle: 'No Career Record information is available to include',
  untitled: 'Untitled CV',
  section: {
    HEADER: 'Header',
    SUMMARY: 'Summary',
    EXPERIENCE: 'Experience',
    EDUCATION: 'Education',
    SKILLS: 'Skills',
    CREDENTIALS: 'Credentials',
    PROJECTS: 'Projects',
    AWARDS: 'Awards',
    LANGUAGES: 'Languages',
    VOLUNTEERING: 'Volunteering',
    PUBLICATIONS: 'Publications',
    OTHER: 'Other',
  },
}

export const cvProjectionCopy: Record<Locale, CvProjectionCopy> = { ar, en }

export function getCvProjectionCopy(locale: Locale): CvProjectionCopy {
  return cvProjectionCopy[locale]
}
