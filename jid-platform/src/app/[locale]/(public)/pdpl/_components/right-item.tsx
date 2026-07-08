type RightItemProps = {
  index: number
  title: string
  description: string
}

/** Section 7 — single PDPL data-subject right (server-rendered). */
export function RightItem({ index, title, description }: RightItemProps) {
  return (
    <article className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary"
        aria-hidden
      >
        {index}
      </span>
      <div>
        <h3 className="font-arabic text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </article>
  )
}
