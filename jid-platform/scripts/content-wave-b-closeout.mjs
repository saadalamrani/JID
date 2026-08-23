/**
 * Interview closeout — Content Wave B catalog patches (demo-critical only).
 * Run from jid-platform/: node scripts/content-wave-b-closeout.mjs
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

function setPath(obj, path, value) {
  const parts = path.split('.')
  let cursor = obj
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]
    if (cursor[part] == null || typeof cursor[part] !== 'object') {
      cursor[part] = {}
    }
    cursor = cursor[part]
  }
  cursor[parts[parts.length - 1]] = value
}

const ar = load('ar')
const en = load('en')

const arSets = {
  'company.applicants.status.draft': 'مسودة',
  'company.applicants.status.saved': 'محفوظ',
  'company.applicants.status.pending': 'قيد التقديم',
  'company.applicants.status.submitted': 'مُرسل',
  'company.applicants.status.under_review': 'قيد المراجعة',
  'company.applicants.status.shortlisted': 'في القائمة المختصرة',
  'company.applicants.status.rejected': 'مرفوض',
  'company.applicants.status.invited': 'مدعو',
  'company.applicants.status.withdrawn': 'منسحب',
  'company.applicants.status.expired': 'منتهٍ',
  'company.applicants.tabs.all': 'الكل',
  'company.applicants.tabs.under_review': 'قيد المراجعة',
  'company.applicants.tabs.interview': 'مقابلة',
  'company.applicants.tabs.accepted': 'مقبول',
  'company.applicants.tabs.rejected': 'مرفوض',
  'company.applicants.tabsAria': 'تصفية المتقدمين حسب الحالة',
  'company.applicants.statusUpdated': 'تم تحديث الحالة إلى: {label}',
  'company.applicants.statusUpdatedMany': 'تم تحديث {count} طلبات إلى: {label}',
  'radar.archivedStatus.shortlisted': 'قُبل',
  'radar.archivedStatus.rejected': 'رفض',
  'radar.archivedStatus.expired': 'انتهت المدة',
  'radar.meetingStatus.pending_confirmation': 'بانتظار التأكيد',
  'radar.meetingStatus.scheduled': 'مجدول',
  'radar.meetingStatus.confirmed': 'مؤكد',
  'radar.meetingStatus.completed': 'مكتمل',
  'radar.meetingStatus.cancelled': 'ملغى',
  'radar.meetingStatus.no_show': 'لم يحضر',
  'radar.deadlineClosed': 'انتهى الموعد',
  'radar.daysToClose': '{count} يوم للإغلاق',
  'radar.emptyBody': 'ستظهر هنا طلباتك والجلسات المؤكدة عندما تبدأ.',
  'cv.cta.title': 'أنشئ سيرتك الذاتية من بيانات ملفك',
  'cv.cta.description': 'صدّر سيرة PDF من بيانات ملفك المهني — راجعها قبل التقديم.',
  'staff.entities.detail.states.unclaimed': 'بلا ملف تعريفي',
  'staff.entities.detail.states.pending': 'معلقة',
  'staff.entities.detail.states.pending_review': 'بانتظار المراجعة',
  'staff.entities.detail.states.approved': 'معتمدة',
  'staff.entities.detail.states.suspended': 'موقوفة',
  'sys.entities.detail.states.unclaimed': 'بلا ملف تعريفي',
  'sys.entities.detail.states.pending': 'معلقة',
  'sys.entities.detail.states.pending_review': 'بانتظار المراجعة',
  'sys.entities.detail.states.approved': 'معتمدة',
  'sys.entities.detail.states.suspended': 'موقوفة',
  'staff.verification.review.directory.states.unclaimed': 'بلا ملف تعريفي',
  'staff.verification.review.directory.states.pending': 'معلقة',
  'staff.verification.review.directory.states.pending_review': 'بانتظار المراجعة',
  'staff.verification.review.directory.states.approved': 'معتمدة',
  'staff.verification.review.directory.states.suspended': 'موقوفة',
}

const enSets = {
  'company.applicants.status.draft': 'Draft',
  'company.applicants.status.saved': 'Saved',
  'company.applicants.status.pending': 'Pending',
  'company.applicants.status.submitted': 'Submitted',
  'company.applicants.status.under_review': 'Under review',
  'company.applicants.status.shortlisted': 'Shortlisted',
  'company.applicants.status.rejected': 'Rejected',
  'company.applicants.status.invited': 'Invited',
  'company.applicants.status.withdrawn': 'Withdrawn',
  'company.applicants.status.expired': 'Expired',
  'company.applicants.tabs.all': 'All',
  'company.applicants.tabs.under_review': 'Under review',
  'company.applicants.tabs.interview': 'Interview',
  'company.applicants.tabs.accepted': 'Accepted',
  'company.applicants.tabs.rejected': 'Rejected',
  'company.applicants.tabsAria': 'Filter applicants by status',
  'company.applicants.statusUpdated': 'Status updated to: {label}',
  'company.applicants.statusUpdatedMany': 'Updated {count} applications to: {label}',
  'radar.archivedStatus.shortlisted': 'Accepted',
  'radar.archivedStatus.rejected': 'Rejected',
  'radar.archivedStatus.expired': 'Expired',
  'radar.meetingStatus.pending_confirmation': 'Awaiting confirmation',
  'radar.meetingStatus.scheduled': 'Scheduled',
  'radar.meetingStatus.confirmed': 'Confirmed',
  'radar.meetingStatus.completed': 'Completed',
  'radar.meetingStatus.cancelled': 'Cancelled',
  'radar.meetingStatus.no_show': 'No-show',
  'radar.deadlineClosed': 'Deadline passed',
  'radar.daysToClose': '{count} days until close',
  'radar.emptyBody': 'Your applications and confirmed sessions will appear here once you start.',
  'cv.cta.title': 'Build your CV from your profile',
  'cv.cta.description': 'Export a professional PDF from your profile data — review it before you apply.',
  'staff.entities.detail.states.unclaimed': 'No owned profile',
  'staff.entities.detail.states.pending': 'Pending',
  'staff.entities.detail.states.pending_review': 'Pending review',
  'staff.entities.detail.states.approved': 'Approved',
  'staff.entities.detail.states.suspended': 'Suspended',
  'sys.entities.detail.states.unclaimed': 'No owned profile',
  'sys.entities.detail.states.pending': 'Pending',
  'sys.entities.detail.states.pending_review': 'Pending review',
  'sys.entities.detail.states.approved': 'Approved',
  'sys.entities.detail.states.suspended': 'Suspended',
  'staff.verification.review.directory.states.unclaimed': 'No owned profile',
  'staff.verification.review.directory.states.pending': 'Pending',
  'staff.verification.review.directory.states.pending_review': 'Pending review',
  'staff.verification.review.directory.states.approved': 'Approved',
  'staff.verification.review.directory.states.suspended': 'Suspended',
}

for (const [path, value] of Object.entries(arSets)) setPath(ar, path, value)
for (const [path, value] of Object.entries(enSets)) setPath(en, path, value)

save('ar', ar)
save('en', en)
console.log(`Wave B closeout: ${Object.keys(arSets).length} AR keys, ${Object.keys(enSets).length} EN keys`)
