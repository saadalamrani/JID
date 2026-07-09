import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'

type RefineTrack = 'consulting' | 'pm' | 'biz_ops'
type RefineLanguage = 'en' | 'ar'

type RefineRequestBody = {
  track?: RefineTrack
  bullets?: string[]
  language?: RefineLanguage
}

type RefineResponse = {
  variants: Array<{ original: string; suggestions: string[] }>
}

const SYSTEM_PROMPT = `You are a CV bullet editor for JID (Saudi career platform).
REWRITE ONLY — never invent employers, titles, tools, or metrics not present in the input bullet.
If a bullet has no numbers, do not add percentages or dollar amounts.
Return strict JSON only: {"variants":[{"original":"...","suggestions":["...","..."]}]}
Each suggestion must be verb-first, ≤2 lines, achievement-oriented.`

const VALID_TRACKS = new Set<RefineTrack>(['consulting', 'pm', 'biz_ops'])
const VALID_LANGUAGES = new Set<RefineLanguage>(['en', 'ar'])

async function checkDailyRateLimit(userId: string): Promise<boolean> {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL')
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')
  if (!url || !token) return true

  const day = new Date().toISOString().slice(0, 10)
  const key = `cv_refine:${userId}:${day}`

  const incrResponse = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!incrResponse.ok) return true

  const incrBody = (await incrResponse.json()) as { result?: number }
  const count = incrBody.result ?? 1

  if (count === 1) {
    await fetch(`${url}/expire/${encodeURIComponent(key)}/86400`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  return count <= 30
}

async function userHasCvProFormats(authHeader: string): Promise<boolean> {
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey || !authHeader) return false

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.1')
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: entitled, error } = await userClient.rpc('has_entitlement', {
    p_feature: 'cv_pro_formats',
  })

  return !error && Boolean(entitled)
}

function buildUserPrompt(params: {
  track: RefineTrack
  language: RefineLanguage
  bullets: string[]
}): string {
  const trackGuidance: Record<RefineTrack, string> = {
    consulting: 'Consulting / strategy voice — impact, stakeholders, analysis.',
    pm: 'Product / program management voice — delivery, roadmap, cross-functional.',
    biz_ops: 'Business operations voice — process, efficiency, scale.',
  }

  return [
    `Track: ${params.track} (${trackGuidance[params.track]})`,
    `Output language: ${params.language}`,
    'Rewrite each bullet; return 2 suggestions per bullet.',
    'Bullets JSON:',
    JSON.stringify(params.bullets),
  ].join('\n')
}

function parseModelJson(text: string, bullets: string[]): RefineResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      variants: bullets.map((original) => ({ original, suggestions: [original] })),
    }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as RefineResponse
    if (!Array.isArray(parsed.variants)) throw new Error('invalid variants')

    return {
      variants: bullets.map((original) => {
        const match = parsed.variants.find((v) => v.original === original)
        const suggestions = match?.suggestions?.filter((s) => typeof s === 'string' && s.trim()) ?? []
        return {
          original,
          suggestions: suggestions.length > 0 ? suggestions.slice(0, 2) : [original],
        }
      }),
    }
  } catch {
    return {
      variants: bullets.map((original) => ({ original, suggestions: [original] })),
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const user = await getUserFromRequest(req)
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const entitled = await userHasCvProFormats(authHeader)
    if (!entitled) {
      return jsonResponse({ error: 'plus_required' }, 403)
    }

    const withinLimit = await checkDailyRateLimit(user.id)
    if (!withinLimit) {
      return jsonResponse({ error: 'rate_limit_exceeded' }, 429)
    }

    const body = (await req.json()) as RefineRequestBody
    const track = body.track ?? 'consulting'
    const language = body.language ?? 'en'
    const bullets = (body.bullets ?? []).map((b) => b.trim()).filter(Boolean).slice(0, 8)

    if (!VALID_TRACKS.has(track) || !VALID_LANGUAGES.has(language)) {
      return jsonResponse({ error: 'Invalid payload' }, 400)
    }

    if (bullets.length === 0) {
      return jsonResponse({ error: 'No bullets provided' }, 400)
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return jsonResponse({ error: 'AI provider not configured' }, 503)
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('ANTHROPIC_CV_MODEL') ?? 'claude-3-5-haiku-20241022',
        max_tokens: 2048,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildUserPrompt({ track, language, bullets }),
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      console.error('cv-refine-bullets provider error', anthropicResponse.status)
      return jsonResponse({ error: 'provider_error', detail: errText.slice(0, 200) }, 502)
    }

    const providerBody = (await anthropicResponse.json()) as {
      content?: Array<{ type: string; text?: string }>
    }

    const text =
      providerBody.content?.find((block) => block.type === 'text')?.text?.trim() ?? ''
    const result = parseModelJson(text, bullets)

    console.log('cv-refine-bullets completed', {
      user_id: user.id,
      bullet_count: bullets.length,
      track,
      language,
    })

    return jsonResponse(result as unknown as Record<string, unknown>)
  } catch (error) {
    console.error('cv-refine-bullets failed', error)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
