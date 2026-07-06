'use client'

import type { CvHeaderDbPatch } from '@/lib/cv/schemas/header'
import type { CvEducationDbPatch } from '@/lib/cv/schemas/education'
import type { CvExperienceDbPatch } from '@/lib/cv/schemas/experience'
import type { CvSkillsDbPatch } from '@/lib/cv/schemas/skills-section'
import type { CvAdditionalDbPatch } from '@/lib/cv/schemas/additional'
import type { CvFullRecord } from '@/types/cv'

export const cvQueryKey = (cvId: string) => ['cv', cvId] as const

export async function fetchCvClient(cvId: string): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv?cvId=${encodeURIComponent(cvId)}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Failed to load CV')
  }

  return (await response.json()) as CvFullRecord
}

export async function patchCvHeaderClient(
  cvId: string,
  patch: CvHeaderDbPatch,
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  })

  const body = (await response.json().catch(() => null)) as
    | CvFullRecord
    | { error?: string }
    | null

  if (!response.ok) {
    throw new Error((body as { error?: string } | null)?.error ?? 'Failed to save CV header')
  }

  return body as CvFullRecord
}

async function parseCvResponse(response: Response, fallbackError: string): Promise<CvFullRecord> {
  const body = (await response.json().catch(() => null)) as CvFullRecord | { error?: string } | null
  if (!response.ok) {
    throw new Error((body as { error?: string } | null)?.error ?? fallbackError)
  }
  return body as CvFullRecord
}

export async function createEducationEntryClient(
  cvId: string,
  payload: { institution_name: string; sort_order: number },
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/education`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return parseCvResponse(response, 'Failed to add education entry')
}

export async function updateEducationEntryClient(
  cvId: string,
  entryId: string,
  patch: CvEducationDbPatch,
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/education/${entryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  })
  return parseCvResponse(response, 'Failed to save education entry')
}

export async function deleteEducationEntryClient(
  cvId: string,
  entryId: string,
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/education/${entryId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return parseCvResponse(response, 'Failed to remove education entry')
}

export async function reorderEducationEntriesClient(
  cvId: string,
  orderedIds: string[],
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/education/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ orderedIds }),
  })
  return parseCvResponse(response, 'Failed to reorder education entries')
}

export async function createExperienceEntryClient(
  cvId: string,
  payload: { company_name: string; job_title: string; sort_order: number },
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/experience`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return parseCvResponse(response, 'Failed to add experience entry')
}

export async function updateExperienceEntryClient(
  cvId: string,
  entryId: string,
  patch: CvExperienceDbPatch,
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/experience/${entryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  })
  return parseCvResponse(response, 'Failed to save experience entry')
}

export async function deleteExperienceEntryClient(
  cvId: string,
  entryId: string,
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/experience/${entryId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return parseCvResponse(response, 'Failed to remove experience entry')
}

export async function reorderExperienceEntriesClient(
  cvId: string,
  orderedIds: string[],
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/experience/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ orderedIds }),
  })
  return parseCvResponse(response, 'Failed to reorder experience entries')
}

export async function patchCvSkillsClient(
  cvId: string,
  patch: CvSkillsDbPatch,
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/skills`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  })
  return parseCvResponse(response, 'Failed to save skills')
}

export async function createAdditionalEntryClient(
  cvId: string,
  payload: { category: string; title: string; sort_order: number },
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/additional`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return parseCvResponse(response, 'Failed to add additional entry')
}

export async function updateAdditionalEntryClient(
  cvId: string,
  entryId: string,
  patch: CvAdditionalDbPatch,
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/additional/${entryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  })
  return parseCvResponse(response, 'Failed to save additional entry')
}

export async function deleteAdditionalEntryClient(
  cvId: string,
  entryId: string,
): Promise<CvFullRecord> {
  const response = await fetch(`/api/me/cv/${cvId}/additional/${entryId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return parseCvResponse(response, 'Failed to remove additional entry')
}

export async function logCvExportClient(cvId: string): Promise<void> {
  const response = await fetch(`/api/me/cv/${cvId}/export`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Failed to log CV export')
  }
}
