import Link from 'next/link'
import type { AnnouncementRow } from '@/lib/announcements/queries'

type AnnouncementListProps = {
  announcements: AnnouncementRow[]
}

function getStatus(row: AnnouncementRow): { label: string; className: string } {
  const now = Date.now()
  if (!row.is_published) return { label: 'Draft', className: 'bg-slate-100 text-slate-700' }
  if (new Date(row.expires_at).getTime() <= now) return { label: 'Expired', className: 'bg-rose-100 text-rose-700' }
  return { label: 'Active', className: 'bg-emerald-100 text-emerald-700' }
}

export function AnnouncementList({ announcements }: AnnouncementListProps) {
  return (
    <div className="space-y-3">
      {announcements.map((row) => {
        const status = getStatus(row)
        return (
          <article key={row.id} className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{row.title_ar}</h3>
                <p className="text-xs text-foreground/60">
                  {new Date(row.created_at).toLocaleString()} · {row.category}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
            </div>
            {row.body_ar ? <p className="mt-2 text-sm text-foreground/75">{row.body_ar}</p> : null}
            <div className="mt-3 flex items-center justify-between text-xs text-foreground/60">
              <span>Expires: {new Date(row.expires_at).toLocaleString()}</span>
              <Link href={`/admin/announcements/${row.id}/edit`} className="font-medium text-primary hover:underline">
                Edit
              </Link>
            </div>
          </article>
        )
      })}
    </div>
  )
}
