import type { ReactNode } from 'react'
import { UniversityLayout } from '@/app/[locale]/(company)/_components/university-layout'

type UniversityGroupLayoutProps = {
  children: ReactNode
}

/**
 * University route-group shell.
 * FOLLOW-UP (architecture): UniversityLayout currently lives under the company route
 * group; a mechanical re-export/move is deferred — do not broaden into a folder refactor.
 */
export default function UniversityGroupLayout({ children }: UniversityGroupLayoutProps) {
  return <UniversityLayout>{children}</UniversityLayout>
}
