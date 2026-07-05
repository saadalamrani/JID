import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { notifyStaff } from '../_shared/notify-staff.ts'
import { createServiceClient } from '../_shared/supabase.ts'

const HEAD_TIMEOUT_MS = 10_000
const BROKEN_NOTIFY_DAYS = 7

type CompanyRow = {
  id: string
  career_portal_url: string | null
  link_status: 'healthy' | 'broken' | 'pending'
  broken_since: string | null
}

type HeadResult = {
  ok: boolean
  httpStatus: number | null
  errorMessage: string | null
}

async function headWithTimeout(url: string): Promise<HeadResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })

    return {
      ok: response.ok,
      httpStatus: response.status,
      errorMessage: response.ok ? null : `HTTP ${response.status}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error'
    return { ok: false, httpStatus: null, errorMessage: message }
  } finally {
    clearTimeout(timer)
  }
}

function isBrokenLongerThanDays(brokenSince: string | null, days: number): boolean {
  if (!brokenSince) return false
  const brokenAt = new Date(brokenSince).getTime()
  if (Number.isNaN(brokenAt)) return false
  return Date.now() - brokenAt >= days * 24 * 60 * 60 * 1000
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    const supabase = createServiceClient()
    const nowIso = new Date().toISOString()

    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('id, career_portal_url, link_status, broken_since')
      .eq('is_active', true)
      .eq('entity_type', 'company')

    if (fetchError) {
      return jsonResponse({ error: fetchError.message }, 500)
    }

    let checked = 0
    let healthy = 0
    let broken = 0
    let pending = 0
    let staffNotified = 0

    for (const company of (companies ?? []) as CompanyRow[]) {
      const url = company.career_portal_url?.trim()
      let nextStatus: CompanyRow['link_status'] = 'pending'
      let httpStatus: number | null = null
      let errorMessage: string | null = null
      let brokenSince: string | null = company.broken_since

      if (!url) {
        nextStatus = 'pending'
        errorMessage = 'Missing career_portal_url'
        pending += 1
      } else {
        const result = await headWithTimeout(url)
        httpStatus = result.httpStatus
        errorMessage = result.errorMessage

        if (result.ok) {
          nextStatus = 'healthy'
          brokenSince = null
          healthy += 1
        } else {
          nextStatus = 'broken'
          if (!brokenSince) brokenSince = nowIso
          broken += 1
        }
      }

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          link_status: nextStatus,
          last_audit_at: nowIso,
          broken_since: brokenSince,
          updated_at: nowIso,
        })
        .eq('id', company.id)

      if (updateError) {
        return jsonResponse({ error: updateError.message }, 500)
      }

      const { error: logError } = await supabase.from('link_audit_log').insert({
        company_id: company.id,
        url: url ?? '',
        link_type: 'career_portal',
        status: nextStatus,
        http_status: httpStatus,
        error_message: errorMessage,
        checked_at: nowIso,
      })

      if (logError) {
        return jsonResponse({ error: logError.message }, 500)
      }

      if (nextStatus === 'broken' && isBrokenLongerThanDays(brokenSince, BROKEN_NOTIFY_DAYS)) {
        await notifyStaff(supabase, company.id, 'broken_link_7days')
        staffNotified += 1
      }

      checked += 1
    }

    return jsonResponse({
      checked,
      healthy,
      broken,
      pending,
      staffNotified,
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal error' },
      500,
    )
  }
})
