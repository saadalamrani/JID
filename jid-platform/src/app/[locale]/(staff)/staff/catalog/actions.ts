'use server'

import { revalidatePath } from 'next/cache'
import { resolve4, resolve6 } from 'node:dns/promises'
import { isIP } from 'node:net'
import { domainToASCII } from 'node:url'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireCatalogStaffAccess } from '@/lib/staff/catalog-operations'

type UntypedClient = SupabaseClient<Record<string, unknown>>
type ActionResult = { ok: boolean; code: string }

const reviewSchema = z.object({
  queueId: z.string().uuid(),
  action: z.enum(['approve', 'approve_pending_domain', 'reject', 'return', 'validate_domain']),
  notes: z.string().trim().min(10).max(2000),
  domain: z.string().trim().max(253).optional(),
  evidenceUrl: z.string().url().startsWith('https://').optional(),
  nameAr: z.string().trim().max(200).optional(),
})

export async function reviewCatalogCandidate(
  input: z.infer<typeof reviewSchema>,
): Promise<ActionResult> {
  await requireCatalogStaffAccess()
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, code: parsed.error.errors[0]?.message ?? 'invalid_input' }
  const client = (await createClient()) as unknown as UntypedClient

  // PostgREST often exposes JWT via request.jwt.claims only; wrappers resolve auth.uid().
  if (parsed.data.action === 'approve_pending_domain') {
    await client.rpc('catalog_claim_review_item', { p_review_queue_id: parsed.data.queueId })
    const { data, error } = await client.rpc('catalog_review_pending_domain', {
      p_review_queue_id: parsed.data.queueId,
      p_notes: parsed.data.notes,
    })
    if (error) return { ok: false, code: error.message }
    const result = (data ?? {}) as ActionResult
    revalidatePath('/staff/catalog')
    revalidatePath('/staff/catalog/review')
    return { ok: result.ok === true, code: result.code ?? 'unknown' }
  }

  const { data, error } = await client.rpc('staff_review_directory_candidate', {
    p_review_queue_id: parsed.data.queueId,
    p_action: parsed.data.action,
    p_notes: parsed.data.notes,
    p_domain: parsed.data.domain || null,
    p_evidence_url: parsed.data.evidenceUrl || null,
    p_name_ar: parsed.data.nameAr || null,
  })
  if (error) return { ok: false, code: error.message }
  const result = (data ?? {}) as ActionResult
  revalidatePath('/staff/catalog')
  revalidatePath('/staff/catalog/review')
  return { ok: result.ok === true, code: result.code ?? 'unknown' }
}

export async function publishCatalogCandidate(queueId: string): Promise<ActionResult> {
  await requireCatalogStaffAccess()
  if (!z.string().uuid().safeParse(queueId).success) return { ok: false, code: 'invalid_queue_id' }
  const client = (await createClient()) as unknown as UntypedClient
  const { data, error } = await client.rpc('staff_publish_directory_candidate', {
    p_review_queue_id: queueId,
  })
  if (error) return { ok: false, code: error.message }
  const result = (data ?? {}) as ActionResult
  revalidatePath('/staff/catalog')
  revalidatePath('/staff/catalog/review')
  return {
    ok: result.ok === true,
    code: result.code ?? (result.ok ? 'published' : 'publication_failed'),
  }
}

function registrableDomain(hostname: string): string {
  return hostname.split('.').slice(-2).join('.')
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 4) {
    const [a = 0, b = 0, c = 0] = address.split('.').map(Number)
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    )
  }
  if (family === 6) {
    const normalized = address.toLowerCase()
    if (normalized.startsWith('::ffff:')) {
      return isPublicAddress(normalized.slice('::ffff:'.length))
    }
    return !(
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith('ff') ||
      normalized.startsWith('2001:db8:')
    )
  }
  return false
}

async function assertPublicDns(hostname: string): Promise<boolean> {
  const lookups = await Promise.allSettled([resolve4(hostname), resolve6(hostname)])
  const addresses = lookups.flatMap((entry) => (entry.status === 'fulfilled' ? entry.value : []))
  if (!addresses.length || addresses.some((address) => !isPublicAddress(address))) {
    throw new Error('domain_dns_not_public')
  }
  return true
}

async function readBoundedHtml(response: Response): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let html = ''
  while (html.length < 200_000) {
    const chunk = await reader.read()
    if (chunk.done) break
    html += decoder.decode(chunk.value, { stream: true })
  }
  await reader.cancel().catch(() => undefined)
  return html.slice(0, 200_000)
}

async function fetchPublicHttps(startUrl: URL): Promise<{ response: Response; finalUrl: URL }> {
  let current = startUrl
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    if (current.protocol !== 'https:') throw new Error('domain_https_required')
    await assertPublicDns(current.hostname)
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: { accept: 'text/html,application/xhtml+xml' },
    })
    if (response.status < 300 || response.status >= 400) return { response, finalUrl: current }
    const location = response.headers.get('location')
    if (!location || redirectCount === 3) throw new Error('domain_redirect_invalid')
    current = new URL(location, current)
  }
  throw new Error('domain_redirect_invalid')
}

export async function checkCatalogDomain(domain: string, legalName: string) {
  await requireCatalogStaffAccess()
  const ascii = domainToASCII(domain.trim().toLowerCase())
  if (!ascii || ascii === 'localhost' || ascii.endsWith('.local') || /^[0-9.]+$/.test(ascii)) {
    return { ok: false, code: 'domain_invalid' } as const
  }
  let dnsResolved = false
  try {
    dnsResolved = await assertPublicDns(ascii)
    const { response, finalUrl } = await fetchPublicHttps(new URL(`https://${ascii}`))
    const html = await readBoundedHtml(response)
    const title =
      html
        .match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]
        ?.replace(/\s+/g, ' ')
        .trim() ?? null
    const finalHost = finalUrl.hostname
    return {
      ok: true,
      dnsResolved,
      httpsReachable: response.ok,
      status: response.status,
      finalHost,
      crossDomainRedirect: registrableDomain(finalHost) !== registrableDomain(ascii),
      homographFlag: domain !== ascii || ascii.startsWith('xn--') || ascii.includes('.xn--'),
      legalName,
      siteTitle: title,
    } as const
  } catch {
    return {
      ok: false,
      dnsResolved,
      httpsReachable: false,
      status: null,
      finalHost: null,
      crossDomainRedirect: false,
      homographFlag: domain !== ascii || ascii.includes('xn--'),
      legalName,
      siteTitle: null,
    } as const
  }
}

export async function configureCatalogPilot(enabled: boolean): Promise<ActionResult> {
  const actor = await requireCatalogStaffAccess()
  if (actor.role !== 'super_admin') return { ok: false, code: 'super_admin_required' }
  const client = (await createClient()) as unknown as UntypedClient
  const { data, error } = await client.rpc('configure_catalog_gleif', {
    p_ingestion_enabled: enabled,
    p_connector_enabled: enabled,
    p_page_size: 10,
    p_max_pages: 1,
  })
  if (error) return { ok: false, code: error.message }
  const result = (data ?? {}) as ActionResult
  revalidatePath('/staff/catalog')
  return { ok: result.ok === true, code: result.code ?? 'unknown' }
}

export async function executeCatalogRetention(): Promise<ActionResult> {
  const actor = await requireCatalogStaffAccess()
  if (actor.role !== 'super_admin') return { ok: false, code: 'super_admin_required' }
  const client = (await createClient()) as unknown as UntypedClient
  const { data, error } = await client.rpc('execute_catalog_retention')
  if (error) return { ok: false, code: error.message }
  const result = (data ?? {}) as ActionResult
  revalidatePath('/staff/catalog')
  return { ok: result.ok === true, code: result.code ?? 'unknown' }
}

export async function redriveCatalogDeadLetter(deadLetterId: string): Promise<ActionResult> {
  const actor = await requireCatalogStaffAccess()
  if (actor.role !== 'super_admin') return { ok: false, code: 'super_admin_required' }
  if (!z.string().uuid().safeParse(deadLetterId).success) {
    return { ok: false, code: 'invalid_dead_letter_id' }
  }
  const client = (await createClient()) as unknown as UntypedClient
  const { data, error } = await client.rpc('redrive_catalog_dead_letter', {
    p_dead_letter_id: deadLetterId,
  })
  if (error) return { ok: false, code: error.message }
  const result = (data ?? {}) as ActionResult
  revalidatePath('/staff/catalog/dead-letters')
  return { ok: result.ok === true, code: result.code ?? 'unknown' }
}
