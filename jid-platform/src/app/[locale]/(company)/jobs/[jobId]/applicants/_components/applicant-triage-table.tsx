'use client'

import type { TriageApplicant } from '@/types/application'
import { ApplicantRow } from './applicant-row'

type ApplicantTriageTableProps = {
  applicants: TriageApplicant[]
  selectedIds: Set<string>
  focusedIndex: number
  onToggleSelect: (id: string, checked: boolean) => void
  rowRefAt: (index: number) => (element: HTMLTableRowElement | null) => void
}

export function ApplicantTriageTable({
  applicants,
  selectedIds,
  focusedIndex,
  onToggleSelect,
  rowRefAt,
}: ApplicantTriageTableProps) {
  if (applicants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-jid-line bg-white px-6 py-12 text-center">
        <p className="font-arabic text-sm text-jid-ink/60">لا يوجد متقدمون في هذا التصنيف</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-jid-line bg-white shadow-sm">
      <table className="min-w-full text-start">
        <thead className="border-b border-jid-line bg-jid-beige/40">
          <tr>
            <th scope="col" className="w-10 px-3 py-3" />
            <th scope="col" className="px-3 py-3 font-arabic text-xs font-medium text-jid-ink/70">
              المتقدم
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 font-arabic text-xs font-medium text-jid-ink/70 md:table-cell"
            >
              البريد
            </th>
            <th scope="col" className="px-3 py-3 font-arabic text-xs font-medium text-jid-ink/70">
              الحالة
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 font-arabic text-xs font-medium text-jid-ink/70 lg:table-cell"
            >
              تاريخ التقديم
            </th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant, index) => (
            <ApplicantRow
              key={applicant.id}
              applicant={applicant}
              selected={selectedIds.has(applicant.id)}
              focused={index === focusedIndex}
              onSelect={(checked) => onToggleSelect(applicant.id, checked)}
              rowRef={rowRefAt(index)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
