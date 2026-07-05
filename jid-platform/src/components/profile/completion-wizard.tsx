'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ProfileCompletionBar } from '@/components/profile/profile-completion-bar'
import { ProfileEmptyState } from '@/components/profile/profile-empty-state'
import { Link } from '@/lib/i18n/navigation'
import {
  calculateWizardCompletionPct,
  isWizardTaskComplete,
  WIZARD_TASK_IDS,
  WIZARD_TASK_WEIGHTS,
  type WizardCompletionInput,
  type WizardTaskId,
} from '@/lib/profile/wizard-completion'
import { cn } from '@/lib/utils'

type CompletionWizardProps = {
  input: WizardCompletionInput
  showEmptyShell?: boolean
}

export function CompletionWizard({ input, showEmptyShell = true }: CompletionWizardProps) {
  const t = useTranslations('profile.public')
  const percent = calculateWizardCompletionPct(input)

  return (
    <section className="space-y-6 rounded-xl border border-jid-line bg-white p-6 shadow-sm">
      {showEmptyShell ? <ProfileEmptyState /> : null}

      <div>
        <h2 className="text-lg font-semibold text-jid-ink">{t('wizardTitle')}</h2>
        <p className="mt-1 text-sm text-jid-ink/60">{t('wizardSubtitle')}</p>
      </div>

      <ProfileCompletionBar percent={percent} />

      <ul className="space-y-2">
        {WIZARD_TASK_IDS.map((taskId) => (
          <WizardTaskRow key={taskId} taskId={taskId} input={input} />
        ))}
      </ul>
    </section>
  )
}

function WizardTaskRow({
  taskId,
  input,
}: {
  taskId: WizardTaskId
  input: WizardCompletionInput
}) {
  const t = useTranslations('profile.public')
  const done = isWizardTaskComplete(taskId, input)
  const weight = WIZARD_TASK_WEIGHTS[taskId]

  return (
    <li>
      <Link
        href={`/profile/edit?focus=${taskId}`}
        className={cn(
          'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
          done
            ? 'border-jid-olive/30 bg-jid-olive/5'
            : 'border-jid-line bg-white hover:border-jid-gold/50 hover:bg-jid-beige/30',
        )}
      >
        <span className="flex items-center gap-3">
          {done ? (
            <CheckCircle2 className="h-5 w-5 text-jid-olive" aria-hidden />
          ) : (
            <Circle className="h-5 w-5 text-jid-line" aria-hidden />
          )}
          <span className={cn('text-sm', done ? 'text-jid-ink/70 line-through' : 'text-jid-ink')}>
            {t(`wizardTask.${taskId}`)}
          </span>
        </span>
        <span className="text-xs font-medium text-jid-ink/50">{weight}%</span>
      </Link>
    </li>
  )
}
