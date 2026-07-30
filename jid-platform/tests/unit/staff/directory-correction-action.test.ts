/**
 * Spec 06-B — reviewCorrectionSuggestion action boundary (mocked Supabase).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireStaffShellAccess = vi.fn()
const approveCorrectionSuggestion = vi.fn()
const rejectCorrectionSuggestion = vi.fn()
const revalidatePath = vi.fn()

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}))

vi.mock('@/lib/staff/require-staff-access', () => ({
  requireStaffShellAccess: (...args: unknown[]) => requireStaffShellAccess(...args),
}))

vi.mock('@/lib/staff/moderation', () => ({
  approveCorrectionSuggestion: (...args: unknown[]) => approveCorrectionSuggestion(...args),
  rejectCorrectionSuggestion: (...args: unknown[]) => rejectCorrectionSuggestion(...args),
  suspendProfile: vi.fn(),
  reinstateProfile: vi.fn(),
}))

vi.mock('@/lib/staff/entities-queries', () => ({
  fetchStaffRegionOptions: vi.fn(),
  fetchStaffSectorOptions: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({})),
}))

const SUGGESTION_ID = '22222222-2222-2222-2222-222222222222'

async function importAction() {
  const mod = await import('@/app/[locale]/(staff)/staff/directory/actions')
  return mod.reviewCorrectionSuggestion
}

beforeEach(() => {
  vi.clearAllMocks()
  requireStaffShellAccess.mockResolvedValue({
    id: 'staff-1',
    role: 'staff',
  })
  approveCorrectionSuggestion.mockResolvedValue(undefined)
  rejectCorrectionSuggestion.mockResolvedValue(undefined)
})

describe('reviewCorrectionSuggestion', () => {
  it('requires staff shell access before deciding', async () => {
    const review = await importAction()
    await review({
      suggestionId: SUGGESTION_ID,
      decision: 'approved',
      reviewNotes: 'Looks correct',
    })
    expect(requireStaffShellAccess).toHaveBeenCalledOnce()
    expect(approveCorrectionSuggestion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ suggestionId: SUGGESTION_ID }),
    )
  })

  it('maps already-decided RPC errors without false success', async () => {
    approveCorrectionSuggestion.mockRejectedValue(new Error('invalid_or_reviewed'))
    const review = await importAction()
    const result = await review({
      suggestionId: SUGGESTION_ID,
      decision: 'approved',
      reviewNotes: 'Looks correct',
    })
    expect(result).toEqual({ ok: false, error: 'already_decided' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('maps directory_missing without false success', async () => {
    approveCorrectionSuggestion.mockRejectedValue(new Error('directory_missing'))
    const review = await importAction()
    const result = await review({
      suggestionId: SUGGESTION_ID,
      decision: 'approved',
      reviewNotes: 'Looks correct',
    })
    expect(result).toEqual({ ok: false, error: 'directory_missing' })
  })

  it('rejects via rejectCorrectionSuggestion and does not approve', async () => {
    const review = await importAction()
    const result = await review({
      suggestionId: SUGGESTION_ID,
      decision: 'rejected',
      reviewNotes: 'Not accurate',
    })
    expect(result).toEqual({ ok: true })
    expect(rejectCorrectionSuggestion).toHaveBeenCalledOnce()
    expect(approveCorrectionSuggestion).not.toHaveBeenCalled()
  })
})
