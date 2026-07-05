import { Code2, ExternalLink, Globe, Link2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SmartLinkKey = 'linkedin' | 'github' | 'portfolio' | string

export type SmartLinksMap = Record<string, string | undefined>

const KNOWN_LINKS: Record<
  string,
  { icon: LucideIcon; label: string; hostHint?: string }
> = {
  linkedin: { icon: Link2, label: 'LinkedIn' },
  github: { icon: Code2, label: 'GitHub' },
  portfolio: { icon: Globe, label: 'Portfolio' },
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function parseSmartLinks(raw: Record<string, unknown> | null | undefined): SmartLinksMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: SmartLinksMap = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && value.trim()) {
      out[key] = value.trim()
    }
  }
  return out
}

type SmartLinkProps = {
  linkKey: SmartLinkKey
  url: string
  label?: string
  className?: string
}

export function SmartLink({ linkKey, url, label, className }: SmartLinkProps) {
  const known = KNOWN_LINKS[linkKey.toLowerCase()]
  const Icon = known?.icon ?? ExternalLink
  const displayLabel = label ?? known?.label ?? linkKey

  return (
    <a
      href={normalizeUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-jid-line bg-white px-3 py-2 text-sm text-jid-ink transition-colors hover:border-jid-gold/50 hover:bg-jid-beige/50',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-jid-olive" aria-hidden />
      <span>{displayLabel}</span>
      <ExternalLink className="h-3 w-3 shrink-0 text-jid-ink/40" aria-hidden />
    </a>
  )
}

type SmartLinksRowProps = {
  smartLinks?: Record<string, unknown> | null
  linkedinUrl?: string | null
  className?: string
}

export function SmartLinksRow({ smartLinks, linkedinUrl, className }: SmartLinksRowProps) {
  const links = parseSmartLinks(smartLinks)

  if (linkedinUrl?.trim() && !links.linkedin) {
    links.linkedin = linkedinUrl.trim()
  }

  const entries = Object.entries(links).filter(([, url]) => Boolean(url))
  if (entries.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {entries.map(([key, url]) => (
        <SmartLink key={key} linkKey={key} url={url!} />
      ))}
    </div>
  )
}

export { parseSmartLinks }
