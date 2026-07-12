import { DirectoryShell } from './_components/directory-shell'
import { loadDirectoryFormOptions } from './actions'
import { fetchStaffDirectoryList } from '@/lib/staff/directory-queries'

type StaffDirectoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** P-108 — Staff Directory editorial surface (Layer 1 / companies only). */
export default async function StaffDirectoryPage({ searchParams }: StaffDirectoryPageProps) {
  const params = await searchParams
  const q = readParam(params.q)

  const [{ rows, total }, { sectors, regions }] = await Promise.all([
    fetchStaffDirectoryList({ q }, 100, 0),
    loadDirectoryFormOptions(),
  ])

  return (
    <DirectoryShell
      rows={rows}
      total={total}
      sectors={sectors}
      regions={regions}
      initialQ={q}
    />
  )
}
