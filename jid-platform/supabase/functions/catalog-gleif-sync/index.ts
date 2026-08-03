import postgres from 'npm:postgres@3.4.7'
import {
  buildGleifPageUrl,
  CATALOG_GLEIF_PAGE_DELAY_MS,
  CATALOG_GLEIF_REQUEST_TIMEOUT_MS,
  CATALOG_GLEIF_RETRY_LIMIT,
  GLEIF_SOURCE_KEY,
  parseGleifRecord,
  sha256Hex,
} from '../_shared/catalog-gleif.ts'

type JsonObject = Record<string, unknown>
type SqlClient = ReturnType<typeof postgres>

const encoder = new TextEncoder()

function json(body: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index]
  return difference === 0
}

function authorized(req: Request): boolean {
  const expected = Deno.env.get('CATALOG_GLEIF_INVOCATION_SECRET')
  const received = req.headers.get('x-catalog-invocation-secret')
  return Boolean(
    expected && received && bytesEqual(encoder.encode(expected), encoder.encode(received)),
  )
}

async function fetchPage(
  url: URL,
): Promise<{ data: unknown[]; next: string | null; retries: number }> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= CATALOG_GLEIF_RETRY_LIMIT; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), CATALOG_GLEIF_REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { accept: 'application/vnd.api+json', 'user-agent': 'JID-Catalog-GLEIF/1.0' },
      })
      if (!response.ok) throw new Error(`gleif_http_${response.status}`)
      const payload = (await response.json()) as JsonObject
      const links = payload.links as JsonObject | undefined
      return {
        data: Array.isArray(payload.data) ? payload.data : [],
        next: typeof links?.next === 'string' ? links.next : null,
        retries: attempt,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('gleif_network_error')
      if (attempt < CATALOG_GLEIF_RETRY_LIMIT)
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError ?? new Error('gleif_request_failed')
}

async function scalar(sql: SqlClient, query: ReturnType<SqlClient>): Promise<JsonObject> {
  const rows = await query
  const first = rows[0] as Record<string, unknown> | undefined
  return (first?.result ?? {}) as JsonObject
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  if (!authorized(req)) return json({ error: 'unauthorized' }, 401)

  const databaseUrl = Deno.env.get('CATALOG_GLEIF_DATABASE_URL')
  if (!databaseUrl) return json({ error: 'database_url_missing' }, 500)

  const input = (await req.json().catch(() => ({}))) as JsonObject
  const externalRunId =
    typeof input.runId === 'string'
      ? input.runId.slice(0, 160)
      : `GLEIF-${new Date()
          .toISOString()
          .replace(/[-:.TZ]/g, '')
          .slice(0, 14)}`
  const sql = postgres(databaseUrl, { max: 1, prepare: false, idle_timeout: 5 })

  let runId: string | null = null
  let retrieved = 0
  let skipped = 0
  let accepted = 0
  let pages = 0
  let retries = 0
  let checkpoint: JsonObject = {}

  try {
    const start = await scalar(
      sql,
      sql`
      select public.catalog_begin_gleif_run(${externalRunId}, 'incremental', 'catalog_worker_gleif') as result
    `,
    )
    if (start.ok !== true)
      return json({ runId: externalRunId, ...start }, start.code === 'already_running' ? 409 : 202)
    runId = String(start.run_id)
    const baseUrl = String(start.api_base_url)
    const pageSize = Number(start.page_size)
    const maxPages = Math.min(Number(start.max_pages), 2)
    let pageUrl: URL | null = buildGleifPageUrl(baseUrl, 1, pageSize)

    while (pageUrl && pages < maxPages) {
      const page = await fetchPage(pageUrl)
      retries += page.retries
      pages += 1
      for (const rawRecord of page.data) {
        retrieved += 1
        try {
          const observedAt = new Date().toISOString()
          const record = parseGleifRecord(rawRecord, observedAt)
          if (record.ignored) {
            skipped += 1
            continue
          }
          const checksum = await sha256Hex(record.checksumInput)
          const sourceRecordKey = `${record.lei}:${checksum.slice(0, 16)}`
          const intake = await scalar(
            sql,
            sql`
            select public.ingest_directory_candidate(
              ${GLEIF_SOURCE_KEY}, ${runId}::uuid, ${sourceRecordKey},
              ${`gleif:${record.lei}:${checksum.slice(0, 24)}`}, ${checksum},
              ${sql.json({
                content_type: 'application/json',
                content_size_bytes: encoder.encode(record.checksumInput).byteLength,
                retrieved_at: observedAt,
                licence_reference: 'GLEIF API Terms of Use and LEI data licence',
                parser_version: '1.0.0',
                personal_data_dominated: false,
              })},
              ${sql.json({
                normalized_identity: record.normalizedIdentity,
                organization_type: 'business',
                deterministic_match_target: null,
              })},
              ${sql.json(record.intakeFacts)}
            ) as result
          `,
          )
          if (intake.ok !== true) {
            skipped += 1
            continue
          }
          const candidateId = String(intake.candidate_id)
          const extended = await scalar(
            sql,
            sql`
            select public.catalog_capture_gleif_facts(${candidateId}::uuid, ${sql.json(record.extendedFacts)}) as result
          `,
          )
          if (extended.ok !== true)
            throw new Error(String(extended.code ?? 'extended_fact_capture_failed'))
          const metadata = await scalar(
            sql,
            sql`
            select public.catalog_capture_gleif_metadata(
              ${candidateId}::uuid, ${record.lei}, ${record.registrationIdentifier},
              ${record.registrationAuthority}, ${record.quarantined ? 'quarantined' : 'new'},
              ${sql.json([])}, ${record.reviewFlags}, ${record.entityStatus},
              ${record.registrationStatus}, ${sql.json(record.payload)}
            ) as result
          `,
          )
          if (metadata.ok !== true)
            throw new Error(String(metadata.code ?? 'metadata_capture_failed'))
          accepted += 1
        } catch (error) {
          skipped += 1
          console.warn(
            '[catalog-gleif-sync] record rejected',
            error instanceof Error ? error.message : 'unknown',
          )
        }
      }
      checkpoint = { page: pages, next: page.next }
      pageUrl = page.next ? new URL(page.next) : null
      if (pageUrl && pages < maxPages)
        await new Promise((resolve) => setTimeout(resolve, CATALOG_GLEIF_PAGE_DELAY_MS))
    }

    const finish = await scalar(
      sql,
      sql`
      select public.catalog_finish_gleif_run(
        ${runId}::uuid, ${skipped > 0 ? 'succeeded_partial' : 'succeeded'},
        ${retrieved}, ${skipped}, ${pages}, ${retries}, ${sql.json(checkpoint)}, null, null
      ) as result
    `,
    )
    return json({
      ok: finish.ok === true,
      runId,
      externalRunId,
      retrieved,
      accepted,
      skipped,
      pages,
      retries,
    })
  } catch (error) {
    if (runId) {
      await sql`
        select public.catalog_finish_gleif_run(
          ${runId}::uuid, 'failed_partial', ${retrieved}, ${skipped}, ${pages}, ${retries},
          ${sql.json(checkpoint)}, 'connector_failure', ${error instanceof Error ? error.message.slice(0, 500) : 'unknown'}
        )
      `.catch(() => undefined)
    }
    return json({ error: error instanceof Error ? error.message : 'connector_failure', runId }, 500)
  } finally {
    await sql.end({ timeout: 2 })
  }
})
