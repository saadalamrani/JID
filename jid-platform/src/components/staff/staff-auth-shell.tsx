import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'

type StaffAuthShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Section 5 — dedicated staff auth chrome (light mode only).
 */
export function StaffAuthShell({ title, subtitle, children, footer }: StaffAuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-jid-beige/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 rounded-lg border border-jid-olive/20 bg-jid-olive/5 px-4 py-3 text-xs text-jid-ink/80">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-jid-olive" aria-hidden />
            <p>Staff operations portal — authorized personnel only. All sign-in attempts are logged.</p>
          </div>
        </div>

        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-jid-ink/50">
            Operations portal
          </p>
          <h1 className="mt-2 font-arabic text-xl font-semibold text-jid-ink">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-jid-ink/70">{subtitle}</p> : null}
        </div>

        <div className="rounded-xl border-2 border-jid-ink/10 bg-white p-6 shadow-sm">
          {children}
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-jid-ink/60">{footer}</div> : null}
      </div>
    </div>
  )
}
