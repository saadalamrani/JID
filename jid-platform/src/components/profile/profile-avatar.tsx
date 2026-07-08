import { BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type ProfileAvatarProps = {
  src?: string | null
  alt: string
  fallbackInitials?: string
  isVerified?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'circle' | 'rounded'
  className?: string
}

const sizeClasses = {
  sm: 'h-14 w-14 text-sm',
  md: 'h-20 w-20 text-lg',
  lg: 'h-24 w-24 text-xl',
} as const

const badgeSizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
} as const

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
}

export function ProfileAvatar({
  src,
  alt,
  fallbackInitials,
  isVerified = false,
  size = 'lg',
  variant = 'circle',
  className,
}: ProfileAvatarProps) {
  const initials = fallbackInitials ?? initialsFromName(alt)
  const rounded = variant === 'circle' ? 'rounded-full' : 'rounded-xl'

  return (
    <div className={cn('relative shrink-0', sizeClasses[size], className)}>
      <div
        className={cn(
          'flex h-full w-full items-center justify-center overflow-hidden border-2 border-border bg-background font-semibold text-primary',
          rounded,
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={96}
            height={96}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span aria-hidden>{initials}</span>
        )}
      </div>
      {isVerified ? (
        <span
          className={cn(
            'absolute -bottom-0.5 -end-0.5 flex items-center justify-center rounded-full bg-card p-0.5 shadow-sm ring-1 ring-border',
            badgeSizeClasses[size],
          )}
          title="Verified"
        >
          <BadgeCheck className="h-full w-full text-accent" aria-hidden />
          <span className="sr-only">Verified</span>
        </span>
      ) : null}
    </div>
  )
}
