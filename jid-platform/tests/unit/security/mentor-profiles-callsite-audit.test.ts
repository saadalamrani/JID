import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function collectFromMentorProfiles(source: string): boolean {
  return source.includes(".from('mentor_profiles')")
}

describe('Gate A remaining mentor_profiles call-site audit', () => {
  it('migrates Claude-flagged non-owner runtime consumers to mentor_public_projection', () => {
    const submit = read('src/lib/mentorship/submit-mentorship-request.ts')
    const timeline = read('src/lib/queries/timeline.ts')
    const clientTimeline = read('src/lib/timeline/client.ts')
    const individual = read('src/lib/profile/individual-profile-projection.ts')
    const sitemap = read('src/lib/seo/sitemap-data.ts')

    for (const source of [submit, timeline, clientTimeline, individual, sitemap]) {
      expect(collectFromMentorProfiles(source)).toBe(false)
      expect(source).toContain('mentor_public_projection')
    }
  })

  it('keeps owner-only and staff mentor_profiles consumers on the base table', () => {
    const ownerOrStaff = [
      'src/lib/mentor-mode/has-mentor-role.ts',
      'src/lib/mentor-hub/queries.ts',
      'src/lib/mentor-hub/update-settings.ts',
      'src/lib/mentor-application/submit.ts',
      'src/lib/hooks/use-mentor-mode.ts',
      'src/lib/staff/mentor-applications.ts',
      'src/lib/staff/review-mentor-application.ts',
      'src/lib/sys/mentor-applications-queries.ts',
      'src/app/[locale]/(sys)/sys/mentor-applications/actions.ts',
    ]

    for (const rel of ownerOrStaff) {
      expect(collectFromMentorProfiles(read(rel))).toBe(true)
    }
  })

  it('documents that getCurrentViewer mentor_profiles read is owner-scoped', () => {
    const source = read('src/lib/profile/queries.ts')
    expect(source).toContain(".from('mentor_profiles')")
    expect(source).toContain(".eq('user_id', user.id)")
  })
})
