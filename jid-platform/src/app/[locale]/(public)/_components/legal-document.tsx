import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type LegalDocumentProps = {
  title: string
  summary: string
  versionLabel: string
  effectiveDateLabel: string
  dir: 'rtl' | 'ltr'
  lang: string
  children: ReactNode
  className?: string
}

/**
 * Section 8.1 — legal page wrapper with `prose-jid` typography.
 * Children should use semantic headings, paragraphs, and lists only.
 */
export function LegalDocument({
  title,
  summary,
  versionLabel,
  effectiveDateLabel,
  dir,
  lang,
  children,
  className,
}: LegalDocumentProps) {
  return (
    <article
      dir={dir}
      lang={lang}
      className={cn('container-jid py-12 md:py-16', className)}
    >
      <header className="mx-auto max-w-3xl border-b border-border pb-8">
        <p className="text-sm font-medium text-accent">{versionLabel}</p>
        <h1 className="mt-2 font-arabic text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{effectiveDateLabel}</p>
        <p className="mt-4 text-base leading-relaxed text-foreground/75">{summary}</p>
      </header>

      <div
        className={cn(
          'prose prose-jid mx-auto mt-10 max-w-3xl',
          dir === 'rtl' ? 'font-arabic' : 'font-latin',
        )}
      >
        {children}
      </div>
    </article>
  )
}
