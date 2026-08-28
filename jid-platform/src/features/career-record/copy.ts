import type {
  CareerEvidenceCategory,
  CareerEvidenceSourceClass,
  CareerEvidenceState,
} from '@/types/contracts'
import type { Locale } from '@/lib/i18n/config'
import type { CareerEvidenceLifecycleAction } from './operations'

export type CareerRecordCopy = {
  metaTitle: string
  title: string
  description: string
  addEvidence: string
  inspect: string
  correctFact: string
  correctFactHint: string
  source: string
  informationState: string
  close: string
  saveDeclared: string
  saveCorrection: string
  cancel: string
  emptyTitle: string
  emptyDescription: string
  loading: string
  errorTitle: string
  errorMessage: string
  retry: string
  forbiddenTitle: string
  forbiddenMessage: string
  unavailableTitle: string
  unavailableMessage: string
  staleTitle: string
  staleMessage: string
  untitled: string
  privateNotice: string
  inRecord: string
  notShared: string
  verificationNotPublic: string
  sourceMissing: string
  sourceSelfDeclared: string
  sourceIssuer: string
  sourceOrganization: string
  sourceObserved: string
  sourceThirdParty: string
  sourceDerived: string
  disclosureTitle: string
  disclosureBody: string
  policyPrivate: string
  noRecipientGrant: string
  openCvProjection: string
  legacyCvCompatibility: string
  category: Record<CareerEvidenceCategory, string>
  state: Record<CareerEvidenceState, string>
  sourceClass: Record<CareerEvidenceSourceClass, string>
  lifecycle: Record<CareerEvidenceLifecycleAction, string>
  lifecycleHint: Record<CareerEvidenceLifecycleAction, string>
  fields: {
    institution_name: string
    company_name: string
    job_title: string
    degree: string
    field_of_study: string
    issuer: string
    organization: string
    role: string
    location: string
    dates: string
    url: string
    description: string
    name: string
    title: string
    start_year: string
    end_year: string
    category: string
  }
  addDialogTitle: string
  correctDialogTitle: string
  categoryLabel: string
  confirmLifecycle: string
}

const ar: CareerRecordCopy = {
  metaTitle: 'السجل المهني',
  title: 'السجل المهني',
  description:
    'معلوماتك وتجاربك ومهاراتك وإنجازاتك المهنية، يديرها جِد كمرجع مهني منظّم. السيرة الذاتية نسخة منفصلة تختار ما يظهر فيها.',
  addEvidence: 'إضافة معلومة',
  inspect: 'عرض التفاصيل',
  correctFact: 'تصحيح',
  correctFactHint:
    'التصحيح يضيف مراجعة جديدة في السجل المهني، ولا يستبدل المعلومة السابقة في الخفاء.',
  source: 'المصدر',
  informationState: 'حالة المعلومة',
  close: 'إغلاق',
  saveDeclared: 'حفظ في السجل',
  saveCorrection: 'حفظ التصحيح',
  cancel: 'إلغاء',
  emptyTitle: 'سجلك المهني فارغ',
  emptyDescription:
    'أضف تعليمك أو خبرتك أو مهاراتك هنا. لن تظهر لأي جهة حتى تختار مشاركتها لاحقاً.',
  loading: 'جارٍ تحميل السجل المهني',
  errorTitle: 'تعذّر تحميل السجل المهني',
  errorMessage: 'لم نتمكن من جلب معلومات السجل. أعد المحاولة.',
  retry: 'إعادة المحاولة',
  forbiddenTitle: 'لا يمكن عرض هذا السجل',
  forbiddenMessage: 'هذه المعلومات غير متاحة لحسابك.',
  unavailableTitle: 'السجل المهني غير متاح حالياً',
  unavailableMessage:
    'حفظ السجل المهني وإدارته ينتظر ربط الخدمة الأساسية. لم نعرض بيانات تجريبية مكانه.',
  staleTitle: 'المعلومات المعروضة أقدم من مصدرها',
  staleMessage: 'اعتمد على تاريخ المصدر الظاهر، ولا تعاملها كمعلومة مؤكدة حديثة.',
  untitled: 'بدون عنوان معروض',
  privateNotice: 'خاص افتراضياً. الوجود في سجلك لا يعني اطلاع جهة التوظيف أو الجامعة أو الفريق.',
  inRecord: 'موجود في سجلي المهني',
  notShared: 'غير مشارك مع جهة أو مستلم',
  verificationNotPublic: 'توثيق المعلومة لا يجعلها عامة.',
  sourceMissing: 'لم يُذكر مصدر إضافي لهذه المعلومة.',
  sourceSelfDeclared: 'صرّحت بها بنفسك.',
  sourceIssuer: 'موثّقة من جهة الإصدار المذكورة في المصدر.',
  sourceOrganization: 'مؤكدة من الجهة المرتبطة بها.',
  sourceObserved: 'رصدها النظام من مسار مصرّح به.',
  sourceThirdParty: 'وردت من مصدر خارجي مبيّن.',
  sourceDerived: 'مستنتجة مع بيان قابل للمراجعة.',
  disclosureTitle: 'الخصوصية والإطلاع',
  disclosureBody:
    'المعلومة في سجلك خاصة. إضافتها لسيرة لا تنشرها. المشاركة مع جهة تتطلب تخويلاً صريحاً لذلك المستلم والغرض.',
  policyPrivate: 'المعالجة الافتراضية: خاصة',
  noRecipientGrant: 'لا يوجد تخويل إطلاع لجهة أو مستلم.',
  openCvProjection: 'فتح السيرة الذاتية',
  legacyCvCompatibility: 'باني السيرة السابق ما زال متاحاً مؤقتاً ولا يُعد المرجع المهني.',
  category: {
    EDUCATION: 'التعليم',
    EXPERIENCE: 'الخبرة',
    SKILL: 'المهارات',
    PROJECT: 'المشاريع',
    CREDENTIAL: 'الشهادات',
    AWARD: 'الجوائز',
    LANGUAGE: 'اللغات',
    VOLUNTEERING: 'العمل التطوعي',
    PUBLICATION: 'المنشورات',
    OTHER: 'أخرى',
  },
  state: {
    DECLARED: 'مصرّح بها منك',
    VERIFIED: 'موثّقة من جهة الإصدار',
    CONFIRMED: 'مؤكدة من الجهة',
    SOURCED: 'من مصدر خارجي',
    DERIVED: 'مستنتجة مع بيان',
    DISPUTED: 'عليها اعتراض',
    CORRECTED: 'صُححت',
    REVOKED: 'سُحبت',
    EXPIRED: 'منتهية',
  },
  sourceClass: {
    SELF_DECLARED: 'تصريح شخصي',
    ISSUER_VERIFIED: 'جهة إصدار',
    ORGANIZATION_CONFIRMED: 'تأكيد جهة',
    SYSTEM_OBSERVED: 'رصد نظامي',
    THIRD_PARTY_SOURCED: 'مصدر خارجي',
    DERIVED_EXPLAINABLE: 'استنتاج مبيّن',
  },
  lifecycle: {
    archive: 'أرشفة',
    dispute: 'تسجيل اعتراض',
    revoke: 'سحب',
    expire: 'وسم الانتهاء',
  },
  lifecycleHint: {
    archive: 'يبقي المعلومة في سجلك دون إظهارها في السير الجديدة.',
    dispute: 'يسجّل اعتراضاً على المعلومة مع الإبقاء على أثرها.',
    revoke: 'متاح فقط عند وجود صلاحية سحب معتمدة.',
    expire: 'متاح فقط عند وجود صلاحية وسم انتهاء معتمدة.',
  },
  fields: {
    institution_name: 'المؤسسة التعليمية',
    company_name: 'جهة العمل',
    job_title: 'المسمّى',
    degree: 'الدرجة',
    field_of_study: 'التخصص',
    issuer: 'الجهة المانحة',
    organization: 'الجهة',
    role: 'الدور',
    location: 'المكان',
    dates: 'الفترة',
    url: 'الرابط',
    description: 'الوصف',
    name: 'الاسم',
    title: 'العنوان',
    start_year: 'سنة البداية',
    end_year: 'سنة النهاية',
    category: 'التصنيف',
  },
  addDialogTitle: 'إضافة معلومة إلى السجل المهني',
  correctDialogTitle: 'تصحيح معلومة في السجل المهني',
  categoryLabel: 'التصنيف',
  confirmLifecycle: 'تأكيد الإجراء',
}

const en: CareerRecordCopy = {
  metaTitle: 'Career Record',
  title: 'Career Record',
  description:
    'Your professional information, experience, skills, and achievements, kept by JID as an organized career reference. A CV is a separate copy you choose what to show from.',
  addEvidence: 'Add information',
  inspect: 'View details',
  correctFact: 'Correct',
  correctFactHint:
    'A correction adds a new Career Record revision. It does not silently overwrite the previous fact.',
  source: 'Source',
  informationState: 'Information status',
  close: 'Close',
  saveDeclared: 'Save to record',
  saveCorrection: 'Save correction',
  cancel: 'Cancel',
  emptyTitle: 'Your Career Record is empty',
  emptyDescription:
    'Add education, experience, or skills here. Nothing is visible to another party until you later choose to share it.',
  loading: 'Loading Career Record',
  errorTitle: 'Could not load Career Record',
  errorMessage: 'The record could not be retrieved. Try again.',
  retry: 'Try again',
  forbiddenTitle: 'This record cannot be shown',
  forbiddenMessage: 'This information is not available to your account.',
  unavailableTitle: 'Career Record is not available yet',
  unavailableMessage:
    'Saving and managing the Career Record waits for the core service to be bound. No sample records are shown in its place.',
  staleTitle: 'Displayed information is older than its source',
  staleMessage: 'Treat the source date as authoritative. Do not treat this as freshly confirmed.',
  untitled: 'No display title',
  privateNotice:
    'Private by default. Being in your record does not give an employer, university, or staff access.',
  inRecord: 'In my Career Record',
  notShared: 'Not shared with a recipient',
  verificationNotPublic: 'Verification does not make the information public.',
  sourceMissing: 'No additional source is attached to this information.',
  sourceSelfDeclared: 'You declared this yourself.',
  sourceIssuer: 'Verified by the issuing body named in the source.',
  sourceOrganization: 'Confirmed by the related organization.',
  sourceObserved: 'Observed by the system on an authorized path.',
  sourceThirdParty: 'Received from a stated external source.',
  sourceDerived: 'Derived with an explainable basis.',
  disclosureTitle: 'Privacy and access',
  disclosureBody:
    'Information in your record is private. Adding it to a CV does not publish it. Sharing with a recipient requires an explicit authorization for that recipient and purpose.',
  policyPrivate: 'Default handling: private',
  noRecipientGrant: 'No recipient-access authorization is present.',
  openCvProjection: 'Open CV',
  legacyCvCompatibility:
    'The previous CV builder remains temporarily available and is not the career reference.',
  category: {
    EDUCATION: 'Education',
    EXPERIENCE: 'Experience',
    SKILL: 'Skills',
    PROJECT: 'Projects',
    CREDENTIAL: 'Credentials',
    AWARD: 'Awards',
    LANGUAGE: 'Languages',
    VOLUNTEERING: 'Volunteering',
    PUBLICATION: 'Publications',
    OTHER: 'Other',
  },
  state: {
    DECLARED: 'Declared by you',
    VERIFIED: 'Verified by issuer',
    CONFIRMED: 'Confirmed by organization',
    SOURCED: 'Externally sourced',
    DERIVED: 'Derived with explanation',
    DISPUTED: 'Disputed',
    CORRECTED: 'Corrected',
    REVOKED: 'Revoked',
    EXPIRED: 'Expired',
  },
  sourceClass: {
    SELF_DECLARED: 'Self-declared',
    ISSUER_VERIFIED: 'Issuer',
    ORGANIZATION_CONFIRMED: 'Organization confirmation',
    SYSTEM_OBSERVED: 'System-observed',
    THIRD_PARTY_SOURCED: 'External source',
    DERIVED_EXPLAINABLE: 'Explainable derivation',
  },
  lifecycle: {
    archive: 'Archive',
    dispute: 'Record a dispute',
    revoke: 'Revoke',
    expire: 'Mark expired',
  },
  lifecycleHint: {
    archive: 'Keeps the information in your record without including it in new CVs.',
    dispute: 'Records a dispute while preserving the underlying history.',
    revoke: 'Available only when an authorized revocation path exists.',
    expire: 'Available only when an authorized expiry path exists.',
  },
  fields: {
    institution_name: 'Institution',
    company_name: 'Employer',
    job_title: 'Title',
    degree: 'Degree',
    field_of_study: 'Field of study',
    issuer: 'Issuer',
    organization: 'Organization',
    role: 'Role',
    location: 'Location',
    dates: 'Period',
    url: 'Link',
    description: 'Description',
    name: 'Name',
    title: 'Title',
    start_year: 'Start year',
    end_year: 'End year',
    category: 'Category',
  },
  addDialogTitle: 'Add information to the Career Record',
  correctDialogTitle: 'Correct Career Record information',
  categoryLabel: 'Category',
  confirmLifecycle: 'Confirm action',
}

export const careerRecordCopy: Record<Locale, CareerRecordCopy> = { ar, en }

export function getCareerRecordCopy(locale: Locale): CareerRecordCopy {
  return careerRecordCopy[locale]
}

export function careerRecordFieldLabel(copy: CareerRecordCopy, key: string): string {
  if (Object.prototype.hasOwnProperty.call(copy.fields, key)) {
    return copy.fields[key as keyof CareerRecordCopy['fields']]
  }
  return key
}
