'use client'

import type { SsisBlock } from '@/lib/ssis/types'
import { SSIS_AI_DISCLAIMER_AR } from '@/lib/ssis/constants'
import { cn } from '@/lib/utils'

type CandidatePreviewProps = {
  blocks: SsisBlock[]
  timeLimitMinutes: number
  className?: string
}

/** Mandatory employer preview — exactly what the candidate sees. */
export function CandidatePreview({ blocks, timeLimitMinutes, className }: CandidatePreviewProps) {
  return (
    <section
      className={cn('rounded-xl border border-jid-olive/30 bg-jid-beige-warm/40 p-5', className)}
      aria-label="معاينة تجربة المرشح"
    >
      <header className="mb-4 border-b border-border/60 pb-3">
        <p className="font-arabic text-xs font-medium text-jid-olive">معاينة المرشح</p>
        <h3 className="mt-1 font-arabic text-base font-semibold text-foreground">فحص أولي ذكي</h3>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">
          {blocks.length} أسئلة · {timeLimitMinutes} دقيقة
        </p>
        <p className="mt-2 font-arabic text-xs text-muted-foreground">{SSIS_AI_DISCLAIMER_AR}</p>
      </header>

      <ol className="space-y-4">
        {blocks.map((block, index) => (
          <li key={block.id} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 font-arabic text-[10px] font-medium">
                {index + 1} / {blocks.length}
              </span>
              <span className="font-arabic text-[10px] text-muted-foreground">
                {block.kind === 'scenario' ? 'سيناريو' : 'نصّي'}
              </span>
            </div>
            <p className="whitespace-pre-wrap font-arabic text-sm leading-relaxed text-foreground">
              {block.prompt_ar}
            </p>
            <textarea
              readOnly
              disabled
              placeholder="اكتب إجابتك هنا..."
              className="mt-3 min-h-[100px] w-full resize-none rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 font-arabic text-sm text-muted-foreground"
            />
          </li>
        ))}
      </ol>
    </section>
  )
}
