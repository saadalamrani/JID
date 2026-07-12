'use client'

import { CompanyShellError } from '../_components/shell-error'

export default function CreateProfileError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <CompanyShellError reset={reset} />
}
