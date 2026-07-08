'use client'

import { Building2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

type CompanyLogoProps = {
  name: string
  logoUrl: string | null
  className?: string
}

export function CompanyLogo({ name, logoUrl, className }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false)
  const initials = name.trim().slice(0, 2) || '؟'

  if (!logoUrl || failed) {
    return (
      <div
        className={
          className ??
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background text-primary'
        }
        aria-hidden
      >
        {failed ? (
          <span className="font-arabic text-sm font-semibold">{initials}</span>
        ) : (
          <Building2 className="h-5 w-5" />
        )}
      </div>
    )
  }

  return (
    <div
      className={
        className ??
        'relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-card'
      }
    >
      <Image
        src={logoUrl}
        alt=""
        fill
        sizes="48px"
        loading="lazy"
        className="object-contain p-1"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
