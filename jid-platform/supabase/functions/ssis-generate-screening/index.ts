import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts'

const MODEL_VERSION = Deno.env.get('ANTHROPIC_SSIS_MODEL') ?? 'claude-3-5-haiku-20241022'

type RubricCriterion = {
  criterion_ar: string
  weight: number
  indicators_ar: string[]
}

type GeneratedBlock = {
  kind: 'text' | 'scenario'
  prompt_ar: string
  rubric: RubricCriterion[]
}

type GenerateBody = {
  job_id?: string
  screening_id?: string
  block_id?: string
}

const SYSTEM_PROMPT = `You are an expert Saudi HR assessment designer. Generate screening blocks in formal Saudi professional Arabic.

Rules:
- Produce exactly ONE block when regenerating, or 3-5 blocks when creating a full screening.
- Mix "text" and "scenario" kinds. NO video. Text and scenario only.
- Scenario blocks MUST reflect the company's sector and ownership context from the provided JSON.
- Each block includes a machine-applicable rubric: [{criterion_ar, weight, indicators_ar[]}]. Weights must sum to 100 per block.
- PROHIBITED: questions about age, gender, region-of-origin, marital status, religion; trick questions; assumptions beyond public company profile.
- Return ONLY valid JSON: {"blocks":[{"kind":"text"|"scenario","prompt_ar":"...","rubric":[...]}]}`

function parseBlocks(text: string): GeneratedBlock[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return []
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { blocks?: GeneratedBlock[] }
    if (!Array.isArray(parsed.blocks)) return []
    return parsed.blocks
      .filter((b) => (b.kind === 'text' || b.kind === 'scenario') && b.prompt_ar?.trim())
      .map((b) => ({
        kind: b.kind,
        prompt_ar: b.prompt_ar.trim(),
        rubric: Array.isArray(b.rubric) ? b.rubric : [],
      }))
  } catch {
    return []
  }
}

async function callAnthropic(contextJson: string, instruction: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('AI provider not configured')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_VERSION,
      max_tokens: 4096,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Context (frozen — do not invent facts beyond this):\n${contextJson}\n\n${instruction}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`provider_error:${response.status}:${errText.slice(0, 200)}`)
  }

  const body = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
  return body.content?.find((b) => b.type === 'text')?.text?.trim() ?? ''
}

async function assertUserOwnsJob(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  jobId: string,
): Promise<{ companyId: string } | null> {
  const { data: job } = await supabase
    .from('jobs')
    .select('company_id, companies(claimed_by)')
    .eq('id', jobId)
    .maybeSingle()

  if (!job) return null

  const company = job.companies as { claimed_by: string | null } | null
  if (company?.claimed_by === userId) {
    return { companyId: job.company_id as string }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role === 'staff' || profile?.role === 'super_admin') {
    return { companyId: job.company_id as string }
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const body = (await req.json()) as GenerateBody
    const supabase = createServiceClient()

    if (!body.job_id && !body.screening_id) {
      return jsonResponse({ error: 'job_id or screening_id required' }, 400)
    }

    let jobId = body.job_id
    let screeningId = body.screening_id
    let companyId: string
    let context: Record<string, unknown>

    if (screeningId) {
      const { data: screening, error } = await supabase
        .from('ssis_screenings')
        .select('id, job_id, company_id, generation_context, status')
        .eq('id', screeningId)
        .maybeSingle()

      if (error || !screening) return jsonResponse({ error: 'screening_not_found' }, 404)
      if (!['draft', 'pending_approval'].includes(screening.status)) {
        return jsonResponse({ error: 'screening_not_editable' }, 400)
      }

      const { data: entitled } = await supabase.rpc('company_has_entitlement', {
        p_company_id: screening.company_id,
        p_feature: 'ssis',
      })
      if (!entitled) return jsonResponse({ error: 'ssis_entitlement_required' }, 403)

      const owned = await assertUserOwnsJob(supabase, user.id, screening.job_id)
      if (!owned) return jsonResponse({ error: 'forbidden' }, 403)

      jobId = screening.job_id
      companyId = screening.company_id
      context = screening.generation_context as Record<string, unknown>
    } else if (jobId) {
      const owned = await assertUserOwnsJob(supabase, user.id, jobId)
      if (!owned) return jsonResponse({ error: 'forbidden' }, 403)
      companyId = owned.companyId

      const { data: entitled } = await supabase.rpc('company_has_entitlement', {
        p_company_id: companyId,
        p_feature: 'ssis',
      })
      if (!entitled) return jsonResponse({ error: 'ssis_entitlement_required' }, 403)

      const { data: ctx, error: ctxErr } = await supabase.rpc('assemble_ssis_generation_context', {
        p_job_id: jobId,
      })
      if (ctxErr || !ctx) return jsonResponse({ error: 'context_assembly_failed' }, 500)
      context = ctx as Record<string, unknown>

      const { data: created, error: createErr } = await supabase
        .from('ssis_screenings')
        .insert({
          job_id: jobId,
          company_id: companyId,
          status: 'draft',
          generation_context: context,
          model_version: MODEL_VERSION,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (createErr || !created) {
        return jsonResponse({ error: createErr?.message ?? 'create_failed' }, 500)
      }
      screeningId = created.id
    } else {
      return jsonResponse({ error: 'invalid_request' }, 400)
    }

    const contextJson = JSON.stringify(context)
    const isRegen = Boolean(body.block_id)

    const instruction = isRegen
      ? 'Regenerate ONE alternative block (different angle, same difficulty). Return JSON with a single block in the blocks array.'
      : 'Generate a complete screening with 3-5 blocks. Return JSON with the blocks array.'

    const modelText = await callAnthropic(contextJson, instruction)
    const blocks = parseBlocks(modelText)

    if (blocks.length === 0) {
      return jsonResponse({ error: 'generation_failed' }, 502)
    }

    if (isRegen && body.block_id) {
      const block = blocks[0]
      const { error: updErr } = await supabase
        .from('ssis_blocks')
        .update({
          kind: block.kind,
          prompt_ar: block.prompt_ar,
          rubric: block.rubric,
          ai_generated: true,
          edited_by_human: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.block_id)
        .eq('screening_id', screeningId)

      if (updErr) return jsonResponse({ error: updErr.message }, 500)

      return jsonResponse({ screening_id: screeningId, block_id: body.block_id, regenerated: true })
    }

    await supabase.from('ssis_blocks').delete().eq('screening_id', screeningId)

    const rows = blocks.map((block, index) => ({
      screening_id: screeningId,
      kind: block.kind,
      display_order: index + 1,
      prompt_ar: block.prompt_ar,
      rubric: block.rubric,
      ai_generated: true,
      edited_by_human: false,
    }))

    const { error: insertErr } = await supabase.from('ssis_blocks').insert(rows)
    if (insertErr) return jsonResponse({ error: insertErr.message }, 500)

    await supabase
      .from('ssis_screenings')
      .update({ model_version: MODEL_VERSION, updated_at: new Date().toISOString() })
      .eq('id', screeningId)

    console.log('ssis-generate-screening completed', {
      user_id: user.id,
      job_id: jobId,
      screening_id: screeningId,
      block_count: rows.length,
    })

    return jsonResponse({
      screening_id: screeningId,
      block_count: rows.length,
      generation_context: context,
    })
  } catch (error) {
    console.error('ssis-generate-screening failed', error)
    const message = error instanceof Error ? error.message : 'Internal error'
    if (message.startsWith('provider_error')) {
      return jsonResponse({ error: 'provider_error' }, 502)
    }
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
