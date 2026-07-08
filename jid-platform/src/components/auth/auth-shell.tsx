import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/logo'

type AuthShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-jid-ink">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-jid-ink/70">{subtitle}</p> : null}
        </div>

        <div className="rounded-xl border border-jid-line bg-white p-6 shadow-sm">{children}</div>

        {footer ? <div className="mt-6 text-center text-sm text-jid-ink/70">{footer}</div> : null}
      </div>
    </div>
  )
}
