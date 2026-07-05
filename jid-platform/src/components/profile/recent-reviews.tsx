import { Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { fetchMentorReviews } from '@/lib/profile/queries'

type RecentReviewsProps = {
  mentorId: string
}

/** Fetches and renders the 3 most recent mentor reviews (Section 6.10). */
export async function RecentReviews({ mentorId }: RecentReviewsProps) {
  const t = await getTranslations('profile.mentor.public')
  const reviews = await fetchMentorReviews(mentorId, 3)

  return (
    <section className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-jid-ink/70">{t('reviewsTitle')}</h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-jid-ink/50">{t('reviewsEmpty')}</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-jid-line pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-jid-ink">
                  {review.reviewer_name ?? t('reviewAnonymous')}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-jid-gold">
                  <Star className="h-4 w-4 fill-jid-gold" aria-hidden />
                  {review.rating}/5
                </span>
              </div>
              {review.body ? (
                <p className="mt-2 text-sm leading-relaxed text-jid-ink/70">{review.body}</p>
              ) : null}
              <p className="mt-2 text-xs text-jid-ink/40">
                {new Date(review.created_at).toLocaleDateString('ar-SA')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
