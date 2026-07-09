import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'

const MODEL_VERSION = Deno.env.get('ANTHROPIC_SSIS_MODEL') ?? 'claude-3-5-haiku-20241022'

type EvaluateBody = {
  invitation_id?: string
}

type CriterionScore = {
  criterion: string
  score: number
  evidence_excerpt: string
}

type BlockEvaluation = {
  block_id: string
  score: number
  per_criterion: CriterionScore[]
}

type EvaluationResult = {
  per_block: BlockEvaluation[]
  composite_score: number
  recommendation: 'advance' | 'review' | 'decline_recommend'
}

const SYSTEM_PROMPT = `You are a rubric-first screening evaluator for Saudi professional hiring.

Rules:
- Apply ONLY the provided rubric criteria — do not invent new criteria.
- Score each criterion 0-100. Block score = weighted average of criteria.
- For each criterion, include a short evidence_excerpt quoting the candidate's own words (Arabic).
- PROHIBITED: inferring protected attributes (age, gender, religion, marital status, region-of-origin).
- Return ONLY valid JSON:
{"per_block":[{"block_id":"uuid","score":number,"per_criterion":[{"criterion":"...","score":number,"evidence_excerpt":"..."}]}],"composite_score":number,"recommendation":"advance"|"review"|"decline_recommend"}`

function computeRecommendation(
  composite: number,
  threshold: number,
): 'advance' | 'review' | 'decline_recommend' {
  if (composite >= threshold + 10) return 'advance'
  if (composite <= threshold - 10) return 'decline_recommend'
  return 'review'
}

function parseEvaluation(text: string, threshold: number): EvaluationResult | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0]) as EvaluationResult
    if (!Array.isArray(parsed.per_block)) return null
    const composite = Number(parsed.composite_score)
    if (Number.isNaN(composite)) return null
    const recommendation = computeRecommendation(composite, threshold)
    return { ...parsed, composite_score: composite, recommendation }
  } catch {
    return null
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
    const body = (await req.json()) as EvaluateBody
    const invitationId = body.invitation_id
    if (!invitationId) return jsonResponse({ error: 'invitation_id required' }, 400)

    const supabase = createServiceClient()

    const { data: invitation, error: invErr } = await supabase
      .from('ssis_invitations')
      .select('id, screening_id, application_id, status')
      .eq('id', invitationId)
      .maybeSingle()

    if (invErr || !invitation) return jsonResponse({ error: 'invitation_not_found' }, 404)
    if (invitation.status !== 'completed') {
      return jsonResponse({ error: 'invitation_not_completed' }, 400)
    }

    const { data: existing } = await supabase
      .from('ssis_evaluations')
      .select('id')
      .eq('invitation_id', invitationId)
      .maybeSingle()

    if (existing) {
      return jsonResponse({ evaluation_id: existing.id, already_evaluated: true })
    }

    const { data: screening } = await supabase
      .from('ssis_screenings')
      .select('pass_threshold, job_id, company_id')
      .eq('id', invitation.screening_id)
      .single()

    const { data: blocks } = await supabase
      .from('ssis_blocks')
      .select('id, prompt_ar, rubric, max_score, display_order')
      .eq('screening_id', invitation.screening_id)
      .order('display_order')

    const { data: responses } = await supabase
      .from('ssis_responses')
      .select('block_id, answer_text')
      .eq('invitation_id', invitationId)

    if (!blocks?.length || !responses?.length) {
      return jsonResponse({ error: 'missing_data' }, 400)
    }

    const payload = {
      pass_threshold: screening?.pass_threshold ?? 60,
      blocks: blocks.map((b) => ({
        block_id: b.id,
        prompt_ar: b.prompt_ar,
        rubric: b.rubric,
        answer_text: responses.find((r) => r.block_id === b.id)?.answer_text ?? '',
      })),
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) return jsonResponse({ error: 'AI provider not configured' }, 503)

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_VERSION,
        max_tokens: 4096,
        temperature: 0.1,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Evaluate using ONLY these rubrics:\n${JSON.stringify(payload, null, 2)}`,
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      console.error('ssis-evaluate provider error', anthropicResponse.status, errText.slice(0, 200))
      return jsonResponse({ error: 'provider_error' }, 502)
    }

    const providerBody = (await anthropicResponse.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    const text = providerBody.content?.find((b) => b.type === 'text')?.text?.trim() ?? ''
    const threshold = Number(screening?.pass_threshold ?? 60)
    const evaluation = parseEvaluation(text, threshold)

    if (!evaluation) {
      return jsonResponse({ error: 'evaluation_parse_failed' }, 502)
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('ssis_evaluations')
      .insert({
        invitation_id: invitationId,
        composite_score: evaluation.composite_score,
        per_block: evaluation.per_block,
        recommendation: evaluation.recommendation,
        model_version: MODEL_VERSION,
      })
      .select('id')
      .single()

    if (insertErr || !inserted) {
      return jsonResponse({ error: insertErr?.message ?? 'insert_failed' }, 500)
    }

    const { data: applicant } = await supabase
      .from('applications')
      .select('applicant_id')
      .eq('id', invitation.application_id)
      .single()

    if (applicant?.applicant_id) {
      await supabase.rpc('dispatch_notification', {
        p_recipient_id: applicant.applicant_id,
        p_category: 'ssis.evaluation_ready',
        p_title_ar: 'نتيجة الفحص الذكي جاهزة',
        p_title_en: 'Smart screening result ready',
        p_body_ar: 'أُكمِل تقييم فحصك الأولي. يمكنك مراجعة ملخص النتيجة في الرادار.',
        p_body_en: 'Your smart screening has been evaluated. View your summary in Radar.',
        p_priority: 'normal',
        p_action_url: `/screenings/${invitationId}`,
        p_action_label_ar: 'عرض الملخص',
        p_action_label_en: 'View summary',
        p_related_resource_type: 'ssis_invitation',
        p_related_resource_id: invitationId,
        p_idempotency_key: `ssis_eval:${invitationId}`,
        p_metadata: {
          recommendation: evaluation.recommendation,
          composite_score: evaluation.composite_score,
        },
      })
    }

    console.log('ssis-evaluate-response completed', {
      invitation_id: invitationId,
      recommendation: evaluation.recommendation,
      composite_score: evaluation.composite_score,
    })

    return jsonResponse({
      evaluation_id: inserted.id,
      recommendation: evaluation.recommendation,
      composite_score: evaluation.composite_score,
    })
  } catch (error) {
    console.error('ssis-evaluate-response failed', error)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
