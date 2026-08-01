import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type OrgOutcomeTone = 'neutral' | 'pending' | 'rejected' | 'blocked' | 'approved'

const TONE_CLASS: Record<OrgOutcomeTone, string> = {
  neutral: 'border-border',
  pending: 'border-border border-s-4 border-s-jid-gold',
  rejected: 'border-border border-s-4 border-s-destructive',
  blocked: 'border-border border-s-4 border-s-destructive',
  approved: 'border-border border-s-4 border-s-jid-gold',
}

type OrgOutcomePanelProps = {
  tone?: OrgOutcomeTone
  children: ReactNode
  className?: string
  testId?: string
}

/** Spec 08-D — flat outcome panel shared by Business/University lifecycle surfaces. */
export function OrgOutcomePanel({
  tone = 'neutral',
  children,
  className,
  testId,
}: OrgOutcomePanelProps) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <div
        data-testid={testId}
        className={cn(
          'rounded-lg border bg-card p-6 text-foreground',
          TONE_CLASS[tone],
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
