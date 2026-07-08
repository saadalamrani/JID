import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'

type StaffAuthShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Section 5 — dedicated staff auth chrome.
 */
export function StaffAuthShell({ title, subtitle, children, footer }: StaffAuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p>Staff operations portal — authorized personnel only. All sign-in attempts are logged.</p>
          </div>
        </div>

        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Operations portal
          </p>
          <h1 className="mt-2 font-arabic text-xl font-semibold text-foreground">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="rounded-xl border-2 border-border/60 bg-card p-6 shadow-sm">
          {children}
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  )
}
