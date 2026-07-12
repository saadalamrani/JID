import type { ReactNode } from 'react'

type ShellForbiddenProps = {
  title: string
  message: string
  action?: ReactNode
}

/** Sprint 0 pattern — minimal forbidden-state shell (P-109 profile suspended). */
export function ShellForbidden({ title, message, action }: ShellForbiddenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  )
}
