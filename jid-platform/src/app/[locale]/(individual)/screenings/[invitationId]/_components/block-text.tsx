'use client'

import type { SsisBlockKind } from '@/lib/ssis/types'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type BlockTextProps = {
  prompt: string
  value: string
  onChange: (value: string) => void
  kind: SsisBlockKind
  index: number
  total: number
  className?: string
}

export function BlockText({
  prompt,
  value,
  onChange,
  kind,
  index,
  total,
  className,
}: BlockTextProps) {
  return (
    <article className={cn('space-y-4', className)}>
      <header>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 font-arabic text-[10px] font-medium">
            {index + 1} / {total}
          </span>
          <span className="font-arabic text-[10px] text-muted-foreground">
            {kind === 'scenario' ? 'سيناريو' : 'سؤال نصّي'}
          </span>
        </div>
        <p className="mt-3 whitespace-pre-wrap font-arabic text-base leading-relaxed text-foreground">
          {prompt}
        </p>
      </header>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        placeholder="اكتب إجابتك هنا..."
        className="font-arabic text-sm"
        aria-label={`إجابة السؤال ${index + 1}`}
      />
    </article>
  )
}
