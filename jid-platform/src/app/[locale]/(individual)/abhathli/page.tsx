import { getTranslations } from 'next-intl/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { AbhathliWorkspace } from '@/components/abhathli/abhathli-workspace'

export default async function AbhathliPage() {
  await requireAuthenticatedUser()
  const t = await getTranslations('abhathli')

  return (
    <main className="container-jid py-8">
      <h1 className="sr-only">{t('title')}</h1>
      <AbhathliWorkspace />
    </main>
  )
}

export async function generateMetadata() {
  const t = await getTranslations('abhathli')
  return { title: t('title') }
}
