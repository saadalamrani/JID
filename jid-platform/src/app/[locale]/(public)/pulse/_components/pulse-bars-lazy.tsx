import dynamic from 'next/dynamic'
import type { SectorDemandRow, SkillsDemandRow } from '@/lib/pulse/queries'

const BarsSkeleton = () => (
  <div className="space-y-3" aria-hidden>
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="h-6 animate-pulse rounded-full bg-muted/50" />
    ))}
  </div>
)

export const SectorBarsLazy = dynamic(
  () => import('./sector-bars').then((mod) => ({ default: mod.SectorBars })),
  { loading: () => <BarsSkeleton /> },
)

export const SkillsBarsLazy = dynamic(
  () => import('./skills-bars').then((mod) => ({ default: mod.SkillsBars })),
  { loading: () => <BarsSkeleton /> },
)

type SectorBarsLazyProps = {
  items: SectorDemandRow[]
}

type SkillsBarsLazyProps = {
  items: SkillsDemandRow[]
}

export function SectorBarsSection({ items }: SectorBarsLazyProps) {
  return <SectorBarsLazy items={items} />
}

export function SkillsBarsSection({ items }: SkillsBarsLazyProps) {
  return <SkillsBarsLazy items={items} />
}
