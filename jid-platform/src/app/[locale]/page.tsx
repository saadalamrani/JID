import { HomeHero } from './_components/home-hero'
import { FeaturedMentorsSection } from './_components/featured-mentors-section'
import { fetchFeaturedMentorsByScore } from '@/lib/queries/mentors'

export default async function HomePage() {
  const featuredMentors = await fetchFeaturedMentorsByScore(3)

  return (
    <main>
      <HomeHero />
      <FeaturedMentorsSection mentors={featuredMentors} />
    </main>
  )
}
