import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { mapMentorFromPublicProjection } from '@/lib/timeline/map-mentor-from-public-projection'

describe('Gate A timeline mentor projection mapping', () => {
  it('maps public projection fields without losing name/avatar', () => {
    const mentorId = '33333333-3333-4333-8333-333333333333'
    const mentors = new Map([
      [
        mentorId,
        {
          user_id: mentorId,
          slug: 'sara-mentor',
          headline: 'Product Lead',
          full_name: 'Sara Mentor',
          avatar_url: 'https://cdn.example/a.png',
        },
      ],
    ])

    expect(mapMentorFromPublicProjection(mentorId, mentors)).toEqual({
      id: mentorId,
      slug: 'sara-mentor',
      current_role: 'Product Lead',
      profile: {
        full_name: 'Sara Mentor',
        avatar_url: 'https://cdn.example/a.png',
      },
    })
  })

  it('returns null identity fields when the mentor is absent from the projection', () => {
    const mentorId = '44444444-4444-4444-8444-444444444444'
    expect(mapMentorFromPublicProjection(mentorId, new Map())).toEqual({
      id: mentorId,
      slug: null,
      current_role: null,
      profile: null,
    })
  })

  it('routes server and client timeline mentor lookups through mentor_public_projection', () => {
    const root = process.cwd()
    const server = fs.readFileSync(path.join(root, 'src/lib/queries/timeline.ts'), 'utf8')
    const client = fs.readFileSync(path.join(root, 'src/lib/timeline/client.ts'), 'utf8')

    for (const source of [server, client]) {
      expect(source).toContain(".from('mentor_public_projection')")
      expect(source).not.toContain(".from('mentor_profiles')")
      expect(source).not.toContain('profiles!mentor_profiles_user_id_fkey')
      expect(source).not.toMatch(/application_message|rejection_reason|reviewed_by/)
    }
  })
})
