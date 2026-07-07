import { NextResponse } from 'next/server'
import { trackServer } from '@/lib/analytics/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { iterateSysAuditExport } from '@/lib/sys/audit-queries'
import { requireSysApiSuperAdmin } from '@/lib/sys/require-sys-api-access'
import type { SysAuditFilters } from '@/types/sys-audit'

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function rowToCsv(event: {
  id: string
  created_at: string
  action: string
  actor_id: string | null
  actor_name: string | null
  entity_type: string
  entity_id: string | null
  ip_address: string | null
  metadata: Record<string, unknown>
}): string {
  const reason = typeof event.metadata.reason === 'string' ? event.metadata.reason : ''
  return [
    event.id,
    event.created_at,
    event.action,
    event.actor_id ?? '',
    event.actor_name ?? '',
    event.entity_type,
    event.entity_id ?? '',
    event.ip_address ?? '',
    reason,
  ]
    .map((cell) => csvEscape(String(cell)))
    .join(',')
}

/** Section 10 — CSV export with streaming + self-audit. */
export async function GET(request: Request) {
  const profile = await requireSysApiSuperAdmin()
  if (!profile) {
    return new NextResponse(null, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const filters: SysAuditFilters = {
    actor: searchParams.get('actor') ?? undefined,
    actionType: searchParams.get('action_type') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  }

  const encoder = new TextEncoder()
  let rowCount = 0

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          'id,performed_at,action_type,actor_id,actor_name,entity_type,entity_id,ip_address,reason\n',
        ),
      )

      try {
        for await (const batch of iterateSysAuditExport(filters)) {
          for (const event of batch) {
            controller.enqueue(encoder.encode(`${rowToCsv(event)}\n`))
            rowCount += 1
          }
        }

        const admin = createAdminClient()
        await admin.from('audit_logs').insert({
          actor_id: profile.id,
          action: 'audit.exported',
          entity_type: 'audit_log',
          entity_id: null,
          new_data: {
            row_count: rowCount,
            filters,
          },
          metadata: {
            reason: 'Super Admin CSV export',
            source: 'sys_portal',
            filters,
          },
        })
        await trackServer('sys.audit_exported', profile.id, { row_count: rowCount, filters })
      } catch (err) {
        controller.error(err)
        return
      }

      controller.close()
    },
  })

  const filename = `jid-audit-export-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
