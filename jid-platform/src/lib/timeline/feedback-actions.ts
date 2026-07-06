'use client'

/** Section 8.5 — client actions for timeline feedback prompts. */
export async function submitFeedback(
  meetingId: string,
  feedbackRating: number,
  feedbackComment?: string,
): Promise<void> {
  const response = await fetch(`/api/meetings/${meetingId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      feedback_rating: feedbackRating,
      feedback_comment: feedbackComment?.trim() || undefined,
    }),
  })

  const body = (await response.json().catch(() => null)) as { error?: string } | null
  if (!response.ok) {
    throw new Error(body?.error ?? 'تعذّر إرسال التقييم')
  }
}

export async function dismissForLater(meetingId: string): Promise<void> {
  const response = await fetch(`/api/meetings/${meetingId}/feedback/dismiss`, {
    method: 'POST',
    credentials: 'include',
  })

  const body = (await response.json().catch(() => null)) as { error?: string } | null
  if (!response.ok) {
    throw new Error(body?.error ?? 'تعذّر تأجيل التقييم')
  }
}
