import 'server-only'

/**
 * JID Wave 2 / Front 2A — Frozen Career Record + CV Projection service boundary.
 *
 * Semantics are frozen (see WAVE_2_CAREER_RECORD_MIGRATION_SUBPACKET.md §14).
 * Route/function names may follow repository conventions; meanings may not drift.
 *
 *  - FACT is separated from PRESENTATION. Editing presentation never writes a
 *    Career Evidence revision. Editing a fact always goes through
 *    revise/create Career Evidence.
 *  - Canonical writes go through SECURITY DEFINER RPCs only. This module never
 *    writes the canonical base tables directly.
 *  - Private owner evidence needs no disclosure authorization. An actual
 *    disclosure boundary requires an exact active C5 authorization or it fails
 *    closed.
 *
 * Generated `src/lib/supabase/types.ts` is reconciled after the Wave 2 final
 * closure migration is applied to non-production.
 */
import { createClient } from '@/lib/supabase/server'
import type {
  AuthorizeCareerEvidenceDisclosureInput,
  CareerEvidenceDisclosurePolicy,
  CareerEvidenceLifecycleAction,
  CareerEvidenceRevision,
  CareerEvidenceRoot,
  CareerEvidenceView,
  CareerEvidenceWithHistory,
  CreateApplicationCvSnapshotInput,
  CreateCvSnapshotInput,
  CreateDeclaredCareerEvidenceInput,
  CvProjection,
  CvProjectionItem,
  CvProjectionSection,
  ReviseCareerEvidenceInput,
  UpdateCvPresentationInput,
} from '@/types/career-record'
import { CareerRecordError, mapRpcError } from './errors'

export { CareerRecordError } from './errors'

/** Narrow structural view of the supabase client for the not-yet-generated schema. */
type LooseClient = {
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> }
  from: (table: string) => any
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>
}

async function client(): Promise<LooseClient> {
  return (await createClient()) as unknown as LooseClient
}

async function requireUserId(c: LooseClient): Promise<string> {
  const {
    data: { user },
  } = await c.auth.getUser()
  if (!user) throw new CareerRecordError('يجب تسجيل الدخول', 401)
  return user.id
}

function rpcData<T>(res: { data: unknown; error: { message: string; code?: string } | null }): T {
  if (res.error) mapRpcError(res.error)
  return res.data as T
}

// ---------------------------------------------------------------------------
// Career Record
// ---------------------------------------------------------------------------

/** Owner-scoped current facts plus explicit lifecycle/provenance. */
export async function listCareerEvidence(options?: {
  category?: string
  includeArchived?: boolean
}): Promise<CareerEvidenceView[]> {
  const c = await client()
  const uid = await requireUserId(c)

  let query = c
    .from('career_evidence')
    .select(
      'id, subject_id, category, disclosure_policy_id, current_revision_id, lifecycle_state, archived_at, created_at, updated_at',
    )
    .eq('subject_id', uid)
    .order('updated_at', { ascending: false })

  if (options?.category) query = query.eq('category', options.category)
  if (!options?.includeArchived) query = query.is('archived_at', null)

  const { data: roots, error } = await query
  if (error) throw new CareerRecordError(error.message)

  const rootRows = (roots ?? []) as CareerEvidenceRoot[]
  const revisionIds = rootRows.map((r) => r.current_revision_id).filter(Boolean) as string[]
  const revisions = await fetchRevisionsByIds(c, revisionIds)

  return rootRows.map((root) => ({
    ...root,
    current_revision: root.current_revision_id
      ? (revisions.get(root.current_revision_id) ?? null)
      : null,
  }))
}

/** Owner-scoped current revision and full history for one root. */
export async function getCareerEvidence(evidenceId: string): Promise<CareerEvidenceWithHistory> {
  const c = await client()
  const uid = await requireUserId(c)

  const { data: root, error } = await c
    .from('career_evidence')
    .select(
      'id, subject_id, category, disclosure_policy_id, current_revision_id, lifecycle_state, archived_at, created_at, updated_at',
    )
    .eq('id', evidenceId)
    .eq('subject_id', uid)
    .maybeSingle()

  if (error) throw new CareerRecordError(error.message)
  if (!root) throw new CareerRecordError('الدليل غير موجود', 404)

  const { data: revs, error: revErr } = await c
    .from('career_evidence_revisions')
    .select('*')
    .eq('evidence_id', evidenceId)
    .eq('subject_id', uid)
    .order('revision_no', { ascending: true })

  if (revErr) throw new CareerRecordError(revErr.message)
  const revisions = (revs ?? []) as CareerEvidenceRevision[]
  const typedRoot = root as CareerEvidenceRoot

  return {
    ...typedRoot,
    current_revision:
      revisions.find((r) => r.id === typedRoot.current_revision_id) ?? null,
    revisions,
  }
}

/** Creates only declared, self-authored evidence (revision 1 = SELF_DECLARED/DECLARED). */
export async function createDeclaredCareerEvidence(
  input: CreateDeclaredCareerEvidenceInput,
): Promise<string> {
  const c = await client()
  await requireUserId(c)
  return rpcData<string>(
    await c.rpc('create_career_evidence', {
      p_category: input.category,
      p_fact_payload: input.fact_payload,
      p_effective_from: input.effective_from ?? null,
      p_effective_to: input.effective_to ?? null,
      p_observed_at: input.observed_at ?? null,
      p_source_ref: null,
    }),
  )
}

/** Explicit correction with lineage. Never carries verification forward. */
export async function reviseCareerEvidence(
  evidenceId: string,
  expectedRevisionNo: number,
  input: ReviseCareerEvidenceInput,
): Promise<string> {
  const c = await client()
  await requireUserId(c)
  return rpcData<string>(
    await c.rpc('revise_career_evidence', {
      p_evidence_id: evidenceId,
      p_expected_revision_no: expectedRevisionNo,
      p_fact_payload: input.fact_payload,
      p_effective_from: input.effective_from ?? null,
      p_effective_to: input.effective_to ?? null,
      p_observed_at: input.observed_at ?? null,
    }),
  )
}

/** Archive/dispute (owner) or revoke/expire (where authority permits). */
export async function setCareerEvidenceLifecycle(
  evidenceId: string,
  action: CareerEvidenceLifecycleAction,
  reasonRef?: { id: string; version?: string },
): Promise<void> {
  const c = await client()
  await requireUserId(c)
  rpcData<null>(
    await c.rpc('set_career_evidence_lifecycle', {
      p_evidence_id: evidenceId,
      p_action: action,
      p_reason_ref: reasonRef ?? null,
    }),
  )
}

// ---------------------------------------------------------------------------
// CV projection
// ---------------------------------------------------------------------------

/** Presentation state plus selected canonical evidence resolved to current revisions. */
export async function getCvProjection(cvId: string): Promise<CvProjection> {
  const c = await client()
  const uid = await requireUserId(c)
  await assertCvOwner(c, cvId, uid)

  const [{ data: sections, error: secErr }, { data: items, error: itemErr }] = await Promise.all([
    c
      .from('cv_projection_sections')
      .select('*')
      .eq('cv_id', cvId)
      .order('sort_order', { ascending: true }),
    c
      .from('cv_projection_items')
      .select('*')
      .eq('cv_id', cvId)
      .order('sort_order', { ascending: true }),
  ])
  if (secErr) throw new CareerRecordError(secErr.message)
  if (itemErr) throw new CareerRecordError(itemErr.message)

  const typedItems = (items ?? []) as CvProjectionItem[]
  const evidenceIds = Array.from(new Set(typedItems.map((i) => i.evidence_id)))

  const { data: roots, error: rootErr } = await c
    .from('career_evidence')
    .select(
      'id, subject_id, category, disclosure_policy_id, current_revision_id, lifecycle_state, archived_at, created_at, updated_at',
    )
    .in('id', evidenceIds.length ? evidenceIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('subject_id', uid)
  if (rootErr) throw new CareerRecordError(rootErr.message)

  const rootRows = (roots ?? []) as CareerEvidenceRoot[]
  const revisions = await fetchRevisionsByIds(
    c,
    rootRows.map((r) => r.current_revision_id).filter(Boolean) as string[],
  )

  const evidence: Record<string, CareerEvidenceView> = {}
  for (const root of rootRows) {
    evidence[root.id] = {
      ...root,
      current_revision: root.current_revision_id
        ? (revisions.get(root.current_revision_id) ?? null)
        : null,
    }
  }

  const { data: cvRow, error: cvErr } = await c
    .from('cvs')
    .select('id, title, summary, locale, template_key, updated_at')
    .eq('id', cvId)
    .eq('user_id', uid)
    .maybeSingle()
  if (cvErr) throw new CareerRecordError(cvErr.message)
  if (!cvRow) throw new CareerRecordError('السيرة الذاتية غير موجودة', 404)

  const header = cvRow as {
    id: string
    title: string | null
    summary: string | null
    locale: string
    template_key: string
    updated_at: string
  }

  return {
    cv_id: cvId,
    title: header.title,
    summary: header.summary,
    locale: header.locale === 'en' ? 'en' : 'ar',
    template_key: header.template_key,
    updated_at: header.updated_at,
    sections: (sections ?? []) as CvProjectionSection[],
    items: typedItems,
    evidence,
  }
}

/**
 * Title, summary, template, language, section order and allowed presentation
 * fields only. Never mutates canonical evidence.
 */
export async function updateCvPresentation(
  cvId: string,
  patch: UpdateCvPresentationInput,
): Promise<void> {
  const c = await client()
  const uid = await requireUserId(c)
  await assertCvOwner(c, cvId, uid)

  const headerPatch: Record<string, unknown> = {}
  if (patch.title !== undefined) headerPatch.title = patch.title
  if (patch.summary !== undefined) headerPatch.summary = patch.summary
  if (patch.template_key !== undefined) headerPatch.template_key = patch.template_key
  if (patch.locale !== undefined) headerPatch.locale = patch.locale

  if (Object.keys(headerPatch).length > 0) {
    headerPatch.updated_at = new Date().toISOString()
    const { error } = await c.from('cvs').update(headerPatch).eq('id', cvId).eq('user_id', uid)
    if (error) throw new CareerRecordError(error.message)
  }

  for (const s of patch.section_order ?? []) {
    const { error } = await c
      .from('cv_projection_sections')
      .update({ sort_order: s.sort_order })
      .eq('cv_id', cvId)
      .eq('section_key', s.section_key)
    if (error) throw new CareerRecordError(error.message)
  }
  for (const s of patch.section_headings ?? []) {
    const { error } = await c
      .from('cv_projection_sections')
      .update({ heading_override: s.heading_override })
      .eq('cv_id', cvId)
      .eq('section_key', s.section_key)
    if (error) throw new CareerRecordError(error.message)
  }
  if (patch.item_presentation) {
    const { error } = await c
      .from('cv_projection_items')
      .update({ presentation_payload: patch.item_presentation.presentation_payload })
      .eq('cv_id', cvId)
      .eq('evidence_id', patch.item_presentation.evidence_id)
    if (error) throw new CareerRecordError(error.message)
  }
}

/** Select/unselect/reorder canonical evidence for a section. Does not mutate evidence. */
export async function setCvEvidenceSelection(
  cvId: string,
  sectionKey: string,
  orderedEvidenceIds: string[],
): Promise<void> {
  const c = await client()
  await requireUserId(c)
  rpcData<null>(
    await c.rpc('set_cv_projection_items', {
      p_cv_id: cvId,
      p_section_key: sectionKey,
      p_ordered_evidence_ids: orderedEvidenceIds,
    }),
  )
}

/** Current projection; missing values preserved as missing (never fabricated). */
export async function previewCvProjection(cvId: string): Promise<CvProjection> {
  return getCvProjection(cvId)
}

/**
 * Immutable purpose-bound snapshot. Authorization is prohibited for owner-only
 * export/preview and mandatory for application / public-share / recipient
 * disclosure purposes. Application linking must use createApplicationCvSnapshot.
 */
export async function createCvSnapshot(input: CreateCvSnapshotInput): Promise<string> {
  const c = await client()
  const uid = await requireUserId(c)

  if (input.purpose === 'APPLICATION') {
    throw new CareerRecordError(
      'لقطات التقديم تُنشأ حصراً عبر العملية الذرية create_application_cv_snapshot',
      422,
    )
  }

  const ownerOnly = input.purpose === 'EXPORT' || input.purpose === 'PROFILE_PREVIEW'
  if (ownerOnly && input.authorization_ref) {
    throw new CareerRecordError('لا يجوز إرفاق تفويض إفصاح بلقطة خاصة بالمالك فقط', 400)
  }
  if (!ownerOnly && !input.authorization_ref) {
    throw new CareerRecordError('هذه اللقطة تتطلب تفويض إفصاح نشطًا ومحددًا', 403)
  }

  const projection = await getCvProjection(input.cv_id)
  const manifest =
    input.manifest ??
    projection.items
      .filter((item) => item.is_selected)
      .map((item) => {
        const revision = projection.evidence[item.evidence_id]?.current_revision
        return revision ? { evidence_id: item.evidence_id, revision_id: revision.id } : null
      })
      .filter((row): row is { evidence_id: string; revision_id: string } => row !== null)

  const snapshotPayload =
    input.snapshot_payload ??
    ({
      cv_id: projection.cv_id,
      title: projection.title,
      summary: projection.summary,
      locale: projection.locale,
      template_key: projection.template_key,
      assembled_by: uid,
    } satisfies Record<string, unknown>)

  return rpcData<string>(
    await c.rpc('create_cv_projection_snapshot', {
      p_cv_id: input.cv_id,
      p_purpose: input.purpose,
      p_locale: input.locale ?? projection.locale,
      p_template_key: input.template_key ?? projection.template_key,
      p_snapshot_payload: snapshotPayload,
      p_manifest: manifest,
      p_retention_policy_ref: input.retention_policy_ref ?? { id: 'cv-snapshot-owner', version: '1.0' },
      p_application_id: null,
      p_authorization_id: input.authorization_ref?.id ?? null,
      p_expires_at: input.expires_at ?? null,
    }),
  )
}

/** Atomic APPLICATION snapshot + applications.cv_snapshot_id in one database call. */
export async function createApplicationCvSnapshot(
  input: CreateApplicationCvSnapshotInput,
): Promise<string> {
  const c = await client()
  await requireUserId(c)
  return rpcData<string>(
    await c.rpc('create_application_cv_snapshot', {
      p_application_id: input.application_id,
      p_cv_id: input.cv_id,
      p_authorization_id: input.authorization_id,
      p_retention_policy_ref: input.retention_policy_ref ?? {
        id: 'cv-snapshot-application',
        version: '1.0',
      },
      p_expires_at: input.expires_at ?? null,
    }),
  )
}

// ---------------------------------------------------------------------------
// Disclosure (C5) — only from real reviewed basis + retention input.
// ---------------------------------------------------------------------------

/**
 * Creates a C5 authorization only from real subject/object scope, recipient,
 * purpose, reviewed basis, lifecycle and retention input. It never runs during
 * evidence creation or backfill.
 */
export async function authorizeCareerEvidenceDisclosure(
  input: AuthorizeCareerEvidenceDisclosureInput,
): Promise<string> {
  const c = await client()
  const uid = await requireUserId(c)
  if (input.subject_id !== uid) {
    throw new CareerRecordError('لا يمكنك التفويض بالنيابة عن شخص آخر', 403)
  }
  if ((input.object_ref ? 1 : 0) + (input.data_category ? 1 : 0) !== 1) {
    throw new CareerRecordError('حدد object_ref أو data_category (وليس كليهما)', 400)
  }

  const { data, error } = await c
    .from('disclosure_authorizations')
    .insert({
      subject_id: uid,
      object_ref: input.object_ref ?? null,
      data_category: input.data_category ?? null,
      recipient_type: input.recipient_type,
      recipient_ref: input.recipient_ref ?? null,
      purpose_code: input.purpose_code,
      basis_type: input.basis_type,
      basis_ref: input.basis_ref,
      retention_policy_ref: input.retention_policy_ref,
      effective_at: input.effective_at,
      expires_at: input.expires_at ?? null,
      created_by: uid,
    })
    .select('id')
    .maybeSingle()

  if (error) throw new CareerRecordError(error.message)
  if (!data) throw new CareerRecordError('تعذر إنشاء التفويض', 400)
  return (data as { id: string }).id
}

export async function getCareerEvidenceDisclosurePolicy(
  evidenceId: string,
): Promise<CareerEvidenceDisclosurePolicy> {
  const c = await client()
  const uid = await requireUserId(c)

  const { data: root, error } = await c
    .from('career_evidence')
    .select('id, disclosure_policy_id, subject_id')
    .eq('id', evidenceId)
    .eq('subject_id', uid)
    .maybeSingle()
  if (error) throw new CareerRecordError(error.message)
  if (!root) throw new CareerRecordError('الدليل غير موجود', 404)

  const typedRoot = root as { disclosure_policy_id: string }
  const { data: policy, error: policyErr } = await c
    .from('career_evidence_disclosure_policies')
    .select('id, subject_id, contract_version, default_visibility, supersedes_policy_id, created_at')
    .eq('id', typedRoot.disclosure_policy_id)
    .eq('subject_id', uid)
    .maybeSingle()
  if (policyErr) throw new CareerRecordError(policyErr.message)
  if (!policy) throw new CareerRecordError('سياسة الإفصاح غير موجودة', 404)
  return policy as CareerEvidenceDisclosurePolicy
}

export async function updateCareerEvidenceDisclosurePolicy(
  evidenceId: string,
): Promise<CareerEvidenceDisclosurePolicy> {
  const c = await client()
  await requireUserId(c)
  rpcData<string>(
    await c.rpc('advance_career_evidence_disclosure_policy', { p_evidence_id: evidenceId }),
  )
  return getCareerEvidenceDisclosurePolicy(evidenceId)
}

export async function resolveAuthorizedCareerEvidenceDisclosure(input: {
  evidence_id: string
  authorization_id: string
}): Promise<{
  authorization_id: string
  evidence_id: string
  subject_id: string
  purpose_code: string
  recipient_type: string
  recipient_ref: { id: string; version?: string } | null
  state: string
  effective_at: string
  expires_at: string | null
  basis_type: string
  basis_ref: { id: string; version?: string }
  retention_policy_ref: { id: string; version?: string }
  object_ref: { id: string; version?: string } | null
  data_category: string | null
}> {
  const c = await client()
  await requireUserId(c)
  return rpcData(
    await c.rpc('resolve_authorized_career_evidence_disclosure', {
      p_evidence_id: input.evidence_id,
      p_authorization_id: input.authorization_id,
    }),
  )
}

export async function resolveOwnerCvId(preferredCvId?: string): Promise<string> {
  const c = await client()
  const uid = await requireUserId(c)
  if (preferredCvId) {
    await assertCvOwner(c, preferredCvId, uid)
    return preferredCvId
  }

  const { data: primary, error: primaryErr } = await c
    .from('cvs')
    .select('id')
    .eq('user_id', uid)
    .eq('is_primary', true)
    .maybeSingle()
  if (primaryErr) throw new CareerRecordError(primaryErr.message)
  if (primary) return (primary as { id: string }).id

  const { data: latest, error: latestErr } = await c
    .from('cvs')
    .select('id')
    .eq('user_id', uid)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestErr) throw new CareerRecordError(latestErr.message)
  if (!latest) throw new CareerRecordError('لا توجد سيرة ذاتية', 404)
  return (latest as { id: string }).id
}

export async function listActiveOwnerAuthorizations(): Promise<
  Array<{
    id: string
    purpose_code: string
    recipient_type: string
    recipient_ref: { id: string; version?: string } | null
    object_ref: { id: string; version?: string } | null
    data_category: string | null
    state: string
    effective_at: string
    expires_at: string | null
    revoked_at: string | null
  }>
> {
  const c = await client()
  const uid = await requireUserId(c)
  const { data, error } = await c
    .from('disclosure_authorizations')
    .select(
      'id, purpose_code, recipient_type, recipient_ref, object_ref, data_category, state, effective_at, expires_at, revoked_at',
    )
    .eq('subject_id', uid)
    .eq('state', 'ACTIVE')
  if (error) throw new CareerRecordError(error.message)
  return (data ?? []) as Array<{
    id: string
    purpose_code: string
    recipient_type: string
    recipient_ref: { id: string; version?: string } | null
    object_ref: { id: string; version?: string } | null
    data_category: string | null
    state: string
    effective_at: string
    expires_at: string | null
    revoked_at: string | null
  }>
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function fetchRevisionsByIds(
  c: LooseClient,
  ids: string[],
): Promise<Map<string, CareerEvidenceRevision>> {
  const map = new Map<string, CareerEvidenceRevision>()
  if (ids.length === 0) return map
  const { data, error } = await c
    .from('career_evidence_revisions')
    .select('*')
    .in('id', ids)
  if (error) throw new CareerRecordError(error.message)
  for (const row of (data ?? []) as CareerEvidenceRevision[]) map.set(row.id, row)
  return map
}

async function assertCvOwner(c: LooseClient, cvId: string, uid: string): Promise<void> {
  const { data, error } = await c
    .from('cvs')
    .select('id')
    .eq('id', cvId)
    .eq('user_id', uid)
    .maybeSingle()
  if (error) throw new CareerRecordError(error.message)
  if (!data) throw new CareerRecordError('السيرة الذاتية غير موجودة', 404)
}
