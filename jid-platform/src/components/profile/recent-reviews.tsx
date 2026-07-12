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
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">{t('reviewsTitle')}</h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('reviewsEmpty')}</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {review.reviewer_name ?? t('reviewAnonymous')}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-accent">
                  <Star className="h-4 w-4 fill-accent" aria-hidden />
                  {review.rating}/5
                </span>
              </div>
              {review.review_text ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.review_text}</p>
              ) : null}
              <p className="mt-2 text-xs text-foreground/40">
                {new Date(review.created_at).toLocaleDateString('ar-SA')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
