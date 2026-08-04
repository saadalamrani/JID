import postgres from 'npm:postgres@3.4.7'
import {
  EU_CAREERS_MAX_RECORDS,
  EU_CAREERS_MAX_REDIRECTS,
  EU_CAREERS_MAX_RESPONSE_BYTES,
  EU_CAREERS_MIN_DELAY_MS,
  EU_CAREERS_PARSER_VERSION,
  EU_CAREERS_REQUEST_TIMEOUT_MS,
  EU_CAREERS_RETRY_LIMIT,
  containsHostileInstruction,
  hostAllowed,
  isPublicIpAddress,
  parseEuCareersDetail,
  parseEuCareersList,
  sha256Hex,
} from '../_shared/lammah-eu-careers.ts'

type JsonObject = Record<string, unknown>
type SqlClient = ReturnType<typeof postgres>

const encoder = new TextEncoder()
const userAgent = 'JID-Lammah-EUCareers/1.0 (+https://jid.sa)'

function json(body: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

function authorized(request: Request): boolean {
  const expected = Deno.env.get('LAMMAH_EU_CAREERS_INVOCATION_SECRET')
  const received = request.headers.get('x-lammah-invocation-secret')
  return Boolean(
    expected && received && bytesEqual(encoder.encode(expected), encoder.encode(received)),
  )
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function fetchBounded(
  url: string,
  init: RequestInit,
): Promise<{ response: Response; retries: number }> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= EU_CAREERS_RETRY_LIMIT; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), EU_CAREERS_REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'user-agent': userAgent,
          ...(init.headers ?? {}),
        },
      })
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`eu_careers_http_${response.status}`)
      }
      return { response, retries: attempt }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('eu_careers_network_error')
      if (attempt < EU_CAREERS_RETRY_LIMIT) await wait(500 * 2 ** attempt)
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError ?? new Error('eu_careers_request_failed')
}

type UrlValidation = {
  finalUrl: string
  redirectChain: Array<{ url: string; status: number; location: string | null }>
  evidence: {
    checked_at: string
    status_code: number
    redirect_count: number
    final_destination: string
    method: 'HEAD' | 'GET'
    error_code?: string
  }
  retries: number
}

function safeErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return 'connector_record_failure'
  return /^(?:eu_careers|apply_url)_[a-z0-9_:-]{1,120}$/.test(error.message)
    ? error.message
    : 'connector_record_failure'
}

async function assertPublicDestination(urlValue: string): Promise<void> {
  const url = new URL(urlValue)
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    hostname === 'localhost' || hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') || hostname.endsWith('.internal')
  ) throw new Error('apply_url_private_destination')

  if (/^[\d.]+$/.test(hostname) || hostname.includes(':')) {
    if (!isPublicIpAddress(hostname)) throw new Error('apply_url_private_destination')
    return
  }

  const resolutions = await Promise.allSettled([
    Deno.resolveDns(hostname, 'A'),
    Deno.resolveDns(hostname, 'AAAA'),
  ])
  const addresses = resolutions.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  if (addresses.length === 0) throw new Error('apply_url_dns_unresolved')
  if (addresses.some((address) => !isPublicIpAddress(address))) {
    throw new Error('apply_url_private_destination')
  }
}

async function readBoundedHtml(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType && contentType !== 'text/html' && contentType !== 'application/xhtml+xml') {
    throw new Error('eu_careers_content_type_invalid')
  }
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > EU_CAREERS_MAX_RESPONSE_BYTES) {
    throw new Error('eu_careers_response_too_large')
  }
  if (!response.body) return ''

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const {done,value} = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > EU_CAREERS_MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new Error('eu_careers_response_too_large')
    }
    chunks.push(value)
  }
  const combined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk,offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8',{fatal:false}).decode(combined)
}

async function validateApplyUrl(initialUrl: string, allowedHosts: string[]): Promise<UrlValidation> {
  if (!hostAllowed(initialUrl, allowedHosts)) throw new Error('apply_url_host_not_allowed')
  let current = initialUrl
  let retries = 0
  const redirectChain: UrlValidation['redirectChain'] = []

  for (let hop = 0; hop <= EU_CAREERS_MAX_REDIRECTS; hop += 1) {
    await assertPublicDestination(current)
    let method: 'HEAD' | 'GET' = 'HEAD'
    let fetched = await fetchBounded(current, { method, redirect: 'manual' })
    retries += fetched.retries
    if (fetched.response.status === 405 || fetched.response.status === 501) {
      method = 'GET'
      fetched = await fetchBounded(current, { method, redirect: 'manual' })
      retries += fetched.retries
    }
    const location = fetched.response.headers.get('location')
    redirectChain.push({ url: current, status: fetched.response.status, location })
    if (fetched.response.status >= 300 && fetched.response.status < 400 && location) {
      if (hop === EU_CAREERS_MAX_REDIRECTS) throw new Error('apply_url_redirect_limit_exceeded')
      const next = new URL(location, current).toString()
      if (!hostAllowed(next, allowedHosts)) throw new Error('apply_url_redirect_host_not_allowed')
      current = next
      continue
    }
    if (fetched.response.status < 200 || fetched.response.status >= 400) {
      throw new Error(`apply_url_http_${fetched.response.status}`)
    }
    if (!hostAllowed(current, allowedHosts)) throw new Error('apply_url_final_host_not_allowed')
    return {
      finalUrl: current,
      redirectChain,
      evidence: {
        checked_at: new Date().toISOString(),
        status_code: fetched.response.status,
        redirect_count: redirectChain.length - 1,
        final_destination: current,
        method,
      },
      retries,
    }
  }
  throw new Error('apply_url_validation_failed')
}

async function scalar(sql: SqlClient, query: ReturnType<SqlClient>): Promise<JsonObject> {
  const rows = await query
  const first = rows[0] as Record<string, unknown> | undefined
  return (first?.result ?? {}) as JsonObject
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401)

  const databaseUrl = Deno.env.get('LAMMAH_EU_CAREERS_DATABASE_URL')
  if (!databaseUrl) return json({ error: 'database_url_missing' }, 500)

  const input = (await request.json().catch(() => ({}))) as JsonObject
  const requestedLimit = typeof input.limit === 'number' ? Math.floor(input.limit) : EU_CAREERS_MAX_RECORDS
  const recordLimit = Math.min(Math.max(requestedLimit, 1), EU_CAREERS_MAX_RECORDS)
  const externalRunId = typeof input.runId === 'string'
    ? input.runId.slice(0, 160)
    : `EUCAREERS-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`
  const runMode = input.mode === 'revalidation' ? 'revalidation' : 'incremental'
  const sql = postgres(databaseUrl, { max: 1, prepare: false, idle_timeout: 5 })

  let runId: string | null = null
  let retrieved = 0
  let accepted = 0
  let skipped = 0
  let retries = 0
  const checkedSourceRecordIds: string[] = []
  const seenSourceRecordIds: string[] = []

  try {
    const started = await scalar(
      sql,
      sql`select public.lammah_begin_run(
        ${externalRunId}, ${runMode}, 'lammah_worker_eu_careers'
      ) as result`,
    )
    if (started.ok !== true) {
      return json({ runId: externalRunId, ...started }, started.code === 'already_running_or_replayed' ? 409 : 202)
    }
    runId = String(started.run_id)
    const sourceUrl = String(started.source_url)
    const allowedHosts = Array.isArray(started.allowed_apply_hosts)
      ? started.allowed_apply_hosts.filter((host): host is string => typeof host === 'string')
      : []
    const policy = (started.rate_limit_policy ?? {}) as JsonObject
    const policyLimit = Number(policy.max_records ?? EU_CAREERS_MAX_RECORDS)
    const maxRecords = Math.min(recordLimit, Number.isFinite(policyLimit) ? policyLimit : recordLimit)
    const minDelay = Math.max(Number(policy.min_delay_ms ?? EU_CAREERS_MIN_DELAY_MS), EU_CAREERS_MIN_DELAY_MS)

    await assertPublicDestination(sourceUrl)
    const listFetch = await fetchBounded(sourceUrl, { method: 'GET', redirect: 'error' })
    retries += listFetch.retries
    if (!listFetch.response.ok) throw new Error(`eu_careers_list_http_${listFetch.response.status}`)
    const listHtml = await readBoundedHtml(listFetch.response)
    const listItems = parseEuCareersList(listHtml, sourceUrl, maxRecords)

    for (const [index, listItem] of listItems.entries()) {
      if (index > 0) await wait(minDelay)
      retrieved += 1
      let sourceRecordId: string | null = null
      try {
        const retrievedAt = new Date().toISOString()
        await assertPublicDestination(listItem.detailUrl)
        const detailFetch = await fetchBounded(listItem.detailUrl, { method: 'GET', redirect: 'error' })
        retries += detailFetch.retries
        if (!detailFetch.response.ok) throw new Error(`eu_careers_detail_http_${detailFetch.response.status}`)
        const detailHtml = await readBoundedHtml(detailFetch.response)
        const record = parseEuCareersDetail(detailHtml, listItem.detailUrl)
        sourceRecordId = record.sourceRecordId
        checkedSourceRecordIds.push(record.sourceRecordId)
        seenSourceRecordIds.push(record.sourceRecordId)
        let validation: UrlValidation
        try {
          validation = await validateApplyUrl(record.applyUrl, allowedHosts)
          retries += validation.retries
        } catch (error) {
          validation = {
            finalUrl: record.applyUrl,
            redirectChain: [],
            evidence: {
              checked_at: new Date().toISOString(),
              status_code: 0,
              redirect_count: 0,
              final_destination: record.applyUrl,
              method: 'HEAD',
              error_code: safeErrorCode(error),
            },
            retries: 0,
          }
        }
        const checksum = await sha256Hex(detailHtml)
        const personalDataDominated = (detailHtml.match(/mailto:/gi)?.length ?? 0) > 3
        const hostileContent = containsHostileInstruction(detailHtml)

        const result = await scalar(
          sql,
          sql`select public.ingest_lammah_candidate(
            ${runId}::uuid,
            ${sql.json({
              source_record_id: record.sourceRecordId,
              checksum_sha256: checksum,
              request_identity: `${externalRunId}:${record.sourceRecordId}`,
              source_page_url: record.sourcePageUrl,
              apply_url: record.applyUrl,
              final_apply_url: validation.finalUrl,
              redirect_chain: validation.redirectChain,
              url_validation_evidence: validation.evidence,
              retrieved_at: retrievedAt,
              source_deadline_at: record.sourceDeadlineAt,
              opportunity_type: 'job',
              title_original: record.titleOriginal,
              title_en: record.titleEn,
              organization_raw_name: record.organizationRawName,
              location_country: record.locationCountry,
              location_city: record.locationCity,
              payload_body: detailHtml,
              sanitized_projection: record.sanitizedProjection,
              content_type: detailFetch.response.headers.get('content-type')?.split(';')[0] ?? 'text/html',
              personal_data_dominated: personalDataDominated,
              hostile_content: hostileContent,
            })}
          ) as result`,
        )
        if (result.ok !== true) {
          skipped += 1
          console.warn('[lammah-crawler] record rejected', result.code)
          continue
        }
        accepted += 1
      } catch (error) {
        skipped += 1
        const errorCode = safeErrorCode(error)
        await sql`select public.record_lammah_dead_letter(
          ${runId}::uuid, ${sourceRecordId}, 'connector_record_failure',
          ${sql.json({error_code:errorCode,detail_url:listItem.detailUrl})}
        )`.catch(() => undefined)
        console.warn(
          '[lammah-crawler] record rejected',
          errorCode,
        )
      }
    }

    const checkpoint = {
      checked_source_record_ids: checkedSourceRecordIds,
      seen_source_record_ids: seenSourceRecordIds,
      content_hash: await sha256Hex(listHtml),
      parser_version: EU_CAREERS_PARSER_VERSION,
    }
    const finished = await scalar(
      sql,
      sql`select public.lammah_finish_run(
        ${runId}::uuid, ${skipped > 0 ? 'succeeded_partial' : 'succeeded'},
        ${retrieved}, 1, ${retries}, ${sql.json(checkpoint)}, null, null
      ) as result`,
    )
    return json({
      ok: finished.ok === true,
      runId,
      externalRunId,
      retrieved,
      accepted,
      skipped,
      pages: 1,
      retries,
    })
  } catch (error) {
    if (runId) {
      await sql`select public.lammah_finish_run(
        ${runId}::uuid, 'failed_partial', ${retrieved}, 1, ${retries}, ${sql.json({
          checked_source_record_ids: checkedSourceRecordIds,
          seen_source_record_ids: seenSourceRecordIds,
        })}, 'connector_failure',
        ${error instanceof Error ? error.message.slice(0, 500) : 'unknown'}
      )`.catch(() => undefined)
    }
    return json({ error: error instanceof Error ? error.message : 'connector_failure', runId }, 500)
  } finally {
    await sql.end({ timeout: 2 })
  }
})
