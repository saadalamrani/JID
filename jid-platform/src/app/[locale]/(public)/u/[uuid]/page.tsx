import { redirect } from 'next/navigation'

type LegacyPublicProfileRedirectProps = {
  params: { uuid: string }
}

export default function LegacyPublicProfileRedirectPage({
  params,
}: LegacyPublicProfileRedirectProps) {
  redirect(`/profile/${params.uuid}`)
}
