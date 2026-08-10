export type MentorAvailabilityProjection = {
  user_id: string
  is_accepting_requests: boolean
}

/**
 * Gate A — mentee availability decisions must not read mentor_profiles base rows.
 * Absence from mentor_public_projection means unavailable / not approved.
 */
export function evaluateMentorRequestAvailability(
  menteeId: string,
  mentorId: string,
  mentor: MentorAvailabilityProjection | null,
): { ok: true } | { ok: false; message: string } {
  if (mentorId === menteeId) {
    return { ok: false, message: 'لا يمكنك إرسال طلب إرشاد لنفسك' }
  }
  if (!mentor) {
    return { ok: false, message: 'هذا المرشد غير متاح حالياً' }
  }
  if (!mentor.is_accepting_requests) {
    return { ok: false, message: 'هذا المرشد لا يقبل طلبات جديدة حالياً' }
  }
  return { ok: true }
}
