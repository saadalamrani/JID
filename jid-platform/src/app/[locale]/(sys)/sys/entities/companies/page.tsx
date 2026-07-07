import { EntitiesListContent } from '@/app/[locale]/(sys)/sys/entities/page'

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export default function SysCompaniesPage(props: PageProps) {
  return <EntitiesListContent {...props} entityType="company" />
}
