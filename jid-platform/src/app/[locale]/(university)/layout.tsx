import type { ReactNode } from 'react'
import { UniversityLayout } from '@/app/[locale]/(company)/_components/university-layout'

type UniversityGroupLayoutProps = {
  children: ReactNode
}

export default function UniversityGroupLayout({ children }: UniversityGroupLayoutProps) {
  return <UniversityLayout>{children}</UniversityLayout>
}
