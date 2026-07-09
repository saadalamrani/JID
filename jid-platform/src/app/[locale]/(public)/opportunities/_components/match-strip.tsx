'use client'

import { useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { dismissMandateMatch } from '@/app/[locale]/(public)/opportunities/abhathli-actions'
import type { AbhathliDismissReason } from '@/lib/abhathli/constants'
import {
  abhathliMatchesQueryKey,
} from '@/lib/abhathli/client'
import type { MandateMatchCard } from '@/types/abhathli'
import { MatchCard } from './match-card'

type MatchStripProps = {
  matches: MandateMatchCard[]
}

export function MatchStrip({ matches }: MatchStripProps) {
  const [pending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  const handleDismiss = (matchId: string, reason: AbhathliDismissReason) => {
    startTransition(async () => {
      const result = await dismissMandateMatch(matchId, reason)
      if (!result.ok) {
        window.alert(result.error)
        return
      }
      await queryClient.invalidateQueries({ queryKey: abhathliMatchesQueryKey() })
      await queryClient.invalidateQueries({ queryKey: ['abhathli', 'unseen-count'] })
    })
  }

  if (matches.length === 0) return null

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-1 pt-1"
      role="list"
      aria-label="مطابقات ابحثلي"
    >
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onDismiss={handleDismiss}
          dismissing={pending}
        />
      ))}
    </div>
  )
}
