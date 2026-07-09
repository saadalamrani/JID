import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

const FETCH_TIMEOUT_MS = 20_000
const MAX_ITEMS_PER_SOURCE = 25
const FAILURE_PAUSE_THRESHOLD = 5

type LammahSourceRow = {
  id: string
  name: string
  company_id: string | null
  base_url: string
  source_type: 'career_page' | 'rss' | 'api' | 'official_program'
  trust_tier: 1 | 2
  is_active: boolean
  robots_ok: boolean
  crawl_frequency_hours: number
  last_crawled_at: string | null
  last_content_hash: string | null
  consecutive_failures: number
}

type ParsedOpportunity = {
  title_ar: string | null
  title_en: string | null
  excerpt: string | null
  sector: string
  region: string
  ownership_type: string | null
  experience_level: string | null
  external_url: string
  external_ref_hash: string
  source_published_at: string
  extraction_confidence: number
  company_id: string | null
  company_name_raw: string
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'JID-Lammah-Crawler/1.0 (+https://jid.sa)',
        Accept: 'text/html,application/rss+xml,application/xml,text/xml,*/*',
      },
    })
  } finally {
    clearTimeout(timer)
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim()
}

function parseRssItems(xml: string, baseUrl: string): Array<{ title: string; link: string; pubDate: string | null; description: string | null }> {
  const items: Array<{ title: string; link: string; pubDate: string | null; description: string | null }> = []
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? []

  for (const block of itemBlocks.slice(0, MAX_ITEMS_PER_SOURCE)) {
    const title = decodeXmlEntities(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
    const linkRaw = decodeXmlEntities(block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? '')
    const linkAttr = block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ?? ''
    const link = linkRaw || linkAttr
    const pubDate = decodeXmlEntities(block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ?? '') || null
    const description = decodeXmlEntities(block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ?? '') || null
    if (!title || !link) continue
    try {
      items.push({
        title,
        link: new URL(link, baseUrl).toString(),
        pubDate,
        description: description ? stripTags(description).slice(0, 280) : null,
      })
    } catch {
      // skip invalid URLs
    }
  }

  return items
}

function extractCareerLinks(html: string, baseUrl: string): Array<{ title: string; link: string }> {
  const results: Array<{ title: string; link: string }> = []
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = anchorRegex.exec(html)) !== null && results.length < MAX_ITEMS_PER_SOURCE) {
    const href = match[1]
    const title = stripTags(match[2])
    if (!href || title.length < 4) continue
    const lower = `${href} ${title}`.toLowerCase()
    if (!/(job|career|vacanc|وظيف|فرص|توظيف|careers)/i.test(lower)) continue
    try {
      results.push({ title, link: new URL(href, baseUrl).toString() })
    } catch {
      // skip
    }
  }

  return results
}

function inferSector(title: string, excerpt: string | null): string {
  const text = `${title} ${excerpt ?? ''}`.toLowerCase()
  if (/software|developer|engineer|تقني|مبرمج|هندس/.test(text)) return 'technology-information'
  if (/health|medical|طب|صح/.test(text)) return 'healthcare'
  if (/finance|bank|مالي|مصرف/.test(text)) return 'finance-banking'
  if (/education|تعليم|أكاديم/.test(text)) return 'education'
  return 'professional-services'
}

function inferRegion(title: string, excerpt: string | null): string {
  const text = `${title} ${excerpt ?? ''}`
  if (/الرياض|riyadh/i.test(text)) return 'riyadh'
  if (/جدة|jeddah|مكة|makkah/i.test(text)) return 'makkah'
  if (/الدمام|dammam|الشرقية|eastern/i.test(text)) return 'eastern-province'
  if (/المدينة|madinah/i.test(text)) return 'madinah'
  return 'riyadh'
}

function computeConfidence(input: {
  title: string
  sector: string
  region: string
  hasPubDate: boolean
  trustTier: 1 | 2
  sourceType: LammahSourceRow['source_type']
}): number {
  let score = 0.45
  if (input.title.trim().length >= 8) score += 0.2
  if (input.sector) score += 0.1
  if (input.region) score += 0.1
  if (input.hasPubDate) score += 0.05
  if (input.trustTier === 1) score += 0.05
  if (input.sourceType === 'rss' || input.sourceType === 'api') score += 0.05
  return Math.min(1, Number(score.toFixed(2)))
}

function parsePublishedAt(raw: string | null): string {
  if (!raw) return new Date().toISOString()
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

async function buildOpportunity(
  source: LammahSourceRow,
  item: { title: string; link: string; pubDate?: string | null; description?: string | null },
): Promise<ParsedOpportunity> {
  const sector = inferSector(item.title, item.description ?? null)
  const region = inferRegion(item.title, item.description ?? null)
  const confidence = computeConfidence({
    title: item.title,
    sector,
    region,
    hasPubDate: Boolean(item.pubDate),
    trustTier: source.trust_tier,
    sourceType: source.source_type,
  })

  const refHash = await sha256Hex(`${source.id}:${item.link}`)

  return {
    title_ar: /[\u0600-\u06FF]/.test(item.title) ? item.title : null,
    title_en: /[\u0600-\u06FF]/.test(item.title) ? null : item.title,
    excerpt: item.description ?? null,
    sector,
    region,
    ownership_type: null,
    experience_level: null,
    external_url: item.link,
    external_ref_hash: refHash,
    source_published_at: parsePublishedAt(item.pubDate ?? null),
    extraction_confidence: confidence,
    company_id: source.company_id,
    company_name_raw: source.name,
  }
}

function sourceIsDue(source: LammahSourceRow, nowMs: number): boolean {
  if (!source.last_crawled_at) return true
  const last = new Date(source.last_crawled_at).getTime()
  if (Number.isNaN(last)) return true
  return nowMs - last >= source.crawl_frequency_hours * 60 * 60 * 1000
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createServiceClient()
  const nowIso = new Date().toISOString()
  const nowMs = Date.now()

  const { data: sources, error: sourcesError } = await supabase
    .from('lammah_sources')
    .select(
      'id, name, company_id, base_url, source_type, trust_tier, is_active, robots_ok, crawl_frequency_hours, last_crawled_at, last_content_hash, consecutive_failures',
    )
    .eq('is_active', true)
    .lt('consecutive_failures', FAILURE_PAUSE_THRESHOLD)

  if (sourcesError) return jsonResponse({ error: sourcesError.message }, 500)

  let crawled = 0
  let ingested = 0
  let skipped = 0
  let failures = 0

  for (const source of (sources ?? []) as LammahSourceRow[]) {
    if (!sourceIsDue(source, nowMs)) continue

    try {
      const response = await fetchWithTimeout(source.base_url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const body = await response.text()
      const contentHash = await sha256Hex(body.slice(0, 50_000))

      if (source.source_type === 'career_page' && source.last_content_hash === contentHash) {
        await supabase
          .from('lammah_sources')
          .update({
            last_crawled_at: nowIso,
            consecutive_failures: 0,
          })
          .eq('id', source.id)
        crawled += 1
        continue
      }

      const rawItems =
        source.source_type === 'rss' || source.source_type === 'api' || source.source_type === 'official_program'
          ? parseRssItems(body, source.base_url).map((item) => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              description: item.description,
            }))
          : extractCareerLinks(body, source.base_url).map((item) => ({
              title: item.title,
              link: item.link,
              pubDate: null,
              description: null,
            }))

      for (const item of rawItems) {
        const payload = await buildOpportunity(source, item)
        const { data: newId, error: ingestError } = await supabase.rpc('ingest_lammah_opportunity', {
          p: {
            ...payload,
            source_id: source.id,
          },
        })

        if (ingestError) {
          if (ingestError.message.includes('duplicate') || ingestError.message.includes('unique')) {
            skipped += 1
            continue
          }
          if (
            ingestError.message.includes('stale_posting_rejected') ||
            ingestError.message.includes('invalid_sector') ||
            ingestError.message.includes('invalid_region')
          ) {
            skipped += 1
            continue
          }
          throw ingestError
        }

        if (newId) ingested += 1
        else skipped += 1
      }

      await supabase
        .from('lammah_sources')
        .update({
          last_crawled_at: nowIso,
          last_content_hash: contentHash,
          consecutive_failures: 0,
        })
        .eq('id', source.id)

      crawled += 1
    } catch (error) {
      failures += 1
      const message = error instanceof Error ? error.message : 'crawl_failed'
      await supabase
        .from('lammah_sources')
        .update({
          last_crawled_at: nowIso,
          consecutive_failures: source.consecutive_failures + 1,
        })
        .eq('id', source.id)
      console.error('[lammah-crawler]', source.id, message)
    }
  }

  return jsonResponse({
    ok: true,
    crawled,
    ingested,
    skipped,
    failures,
    checked_sources: (sources ?? []).length,
  })
})
