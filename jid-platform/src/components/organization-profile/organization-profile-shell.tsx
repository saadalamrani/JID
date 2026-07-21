'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DraftPublicationBoundary } from './draft-publication-boundary'
import { ProfileStateBadge } from './profile-state-badge'

export type OrganizationProfileSection =
  | 'overview'
  | 'identity'
  | 'details'
  | 'media'
  | 'preview'
  | 'reference'
  | 'correction'

type OrganizationProfileShellProps = {
  orgKind: 'business' | 'university'
  displayName: string
  status: string
  children: ReactNode
  sectionNav: ReactNode
  mobileHeader?: ReactNode
}

export function OrganizationProfileShell({
  orgKind,
  displayName,
  status,
  children,
  sectionNav,
  mobileHeader,
}: OrganizationProfileShellProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-6 space-y-3">
        {mobileHeader}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-foreground/50">
              {orgKind === 'business' ? 'Business' : 'University'}
            </p>
            <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
          </div>
          <ProfileStateBadge status={status} />
        </div>
        <DraftPublicationBoundary />
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">{sectionNav}</aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}

export function OrganizationProfilePanel({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6', className)}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-foreground/70">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
