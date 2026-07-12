import { redirect } from 'next/navigation'

export default function CompanyRejectedRedirectPage() {
  redirect('/company/verification-rejected')
}
