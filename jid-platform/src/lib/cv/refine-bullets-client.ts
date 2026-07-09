'use client'

import { createClient } from '@/lib/supabase/client'

export type CvRefineTrack = 'consulting' | 'pm' | 'biz_ops'

export type CvRefineLanguage = 'en' | 'ar'

export type CvBulletVariant = {
  original: string
  suggestions: string[]
}

export type CvRefineBulletsResponse = {
  variants: CvBulletVariant[]
}

export async function refineCvBullets(params: {
  track: CvRefineTrack
  language: CvRefineLanguage
  bullets: string[]
}): Promise<CvRefineBulletsResponse> {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('cv-refine-bullets', {
    body: params,
  })

  if (error) {
    throw new Error(error.message)
  }

  const body = data as CvRefineBulletsResponse | { error?: string }
  if ('error' in body && body.error) {
    throw new Error(body.error)
  }

  return body as CvRefineBulletsResponse
}

/** Detect quantified claims that need truthfulness confirmation. */
export function bulletHasQuantifiedClaim(text: string): boolean {
  return /\d|%|٪|million|billion|thousand|مليون|مليار|ألف/i.test(text)
}

export function suggestionIntroducedNewQuantification(
  original: string,
  suggestion: string,
): boolean {
  const originalNumbers: string[] = original.match(/\d+/g) ?? []
  const suggestionNumbers: string[] = suggestion.match(/\d+/g) ?? []
  if (suggestionNumbers.length === 0) return false
  if (originalNumbers.length === 0 && suggestionNumbers.length > 0) return true
  return suggestionNumbers.some((num) => !originalNumbers.includes(num))
}
