import { describe, expect, it } from 'vitest'
import { evaluateMentorRequestAvailability } from '@/lib/mentorship/mentor-request-availability'
import fs from 'node:fs'
import path from 'node:path'

const menteeId = '11111111-1111-4111-8111-111111111111'
const mentorId = '22222222-2222-4222-8222-222222222222'

describe('Gate A mentorship request availability (mentor_public_projection)', () => {
  it('allows an approved accepting mentor through the availability gate', () => {
    const result = evaluateMentorRequestAvailability(menteeId, mentorId, {
      user_id: mentorId,
      is_accepting_requests: true,
    })
    expect(result).toEqual({ ok: true })
  })

  it('denies an approved mentor who is not accepting requests', () => {
    const result = evaluateMentorRequestAvailability(menteeId, mentorId, {
      user_id: mentorId,
      is_accepting_requests: false,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('لا يقبل طلبات')
    }
  })

  it('treats absence from the public projection as unavailable (non-approved)', () => {
    const result = evaluateMentorRequestAvailability(menteeId, mentorId, null)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('غير متاح')
    }
  })

  it('denies self-request before any mentor read', () => {
    const result = evaluateMentorRequestAvailability(menteeId, menteeId, {
      user_id: menteeId,
      is_accepting_requests: true,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('لنفسك')
    }
  })

  it('does not select mentor moderation or application fields', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/mentorship/submit-mentorship-request.ts'),
      'utf8',
    )
    expect(source).toContain(".from('mentor_public_projection')")
    expect(source).not.toContain(".from('mentor_profiles')")
    expect(source).toContain("select('user_id, is_accepting_requests')")
    expect(source).not.toMatch(/application_message|rejection_reason|reviewed_by|reviewed_at/)
    const mentorSelect = source.match(
      /from\('mentor_public_projection'\)[\s\S]*?\.maybeSingle\(\)/,
    )?.[0]
    expect(mentorSelect).toBeTruthy()
    expect(mentorSelect).not.toContain('status')
    expect(mentorSelect).not.toContain('application_')
  })
})
