/**
 * Spec 06-E — create run-scoped synthetic fixtures on disposable local Supabase.
 * Writes docs/.../ui-evidence/spec-06/run-manifest.json (no secrets).
 */
import { createClient } from '@supabase/supabase-js'
import { createHmac, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'docs/command-center/reports/ui-evidence/spec-06')

function loadEnvLocal() {
  const map = {}
  const envText = fs.readFileSync(path.join(root, '.env.local'), 'utf8').replace(/^\uFEFF/, '')
  for (const line of envText.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    map[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return map
}

const env = loadEnvLocal()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const service = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('MISSING_ENV')
  process.exit(1)
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const RUN_ID = `jid06e-${Date.now()}`
const PASSWORD = 'Jid06eSynth!pass'

function base32ToBuf(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleaned = secret.replace(/=+$/, '').toUpperCase()
  let bits = ''
  for (const c of cleaned) {
    const val = alphabet.indexOf(c)
    if (val < 0) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function totp(secret, step = 30, digits = 6) {
  const key = base32ToBuf(secret)
  const counter = Math.floor(Date.now() / 1000 / step)
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter & 0xffffffff, 4)
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(code % 10 ** digits).padStart(digits, '0')
}

async function enrollStaffTotp(email, password) {
  const client = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: signed, error: signErr } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (signErr || !signed.session) throw new Error(`staff signin for mfa: ${signErr?.message}`)
  const { data: enrolled, error: enrollErr } = await client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `jid-06e-${RUN_ID}`,
  })
  if (enrollErr || !enrolled?.totp?.secret) {
    throw new Error(`staff mfa enroll: ${enrollErr?.message ?? 'no secret'}`)
  }
  const code = totp(enrolled.totp.secret)
  const challenge = await client.auth.mfa.challenge({ factorId: enrolled.id })
  if (challenge.error) throw new Error(`staff mfa challenge: ${challenge.error.message}`)
  const verified = await client.auth.mfa.verify({
    factorId: enrolled.id,
    challengeId: challenge.data.id,
    code,
  })
  if (verified.error) throw new Error(`staff mfa verify: ${verified.error.message}`)
  await client.auth.signOut()
  return enrolled.totp.secret
}
const manifest = {
  runId: RUN_ID,
  createdAt: new Date().toISOString(),
  passwordHint: 'synthetic local-only (not committed as secret value in INDEX)',
  users: {},
  companies: {},
  suggestions: {},
  notifications: {},
  verifications: {},
  profiles: {},
}

async function createUser(label, role) {
  const id = randomUUID()
  const email = `${label}-${RUN_ID}@jid.local.test`
  const { data, error } = await admin.auth.admin.createUser({
    id,
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`user ${label}: ${error?.message}`)
  const { error: pErr } = await admin.from('profiles').upsert({
    id: data.user.id,
    full_name: `SYNTH ${label} ${RUN_ID}`,
    locale: 'ar',
    visibility: 'private',
    show_profile_to_companies: false,
    profile_state: 'active',
  })
  if (pErr) throw new Error(`profile ${label}: ${pErr.message}`)
  if (role !== 'individual') {
    const { error: rErr } = await admin.rpc('rls_test_set_user_role', {
      p_target_user_id: data.user.id,
      p_new_role: role,
    })
    if (rErr) throw new Error(`role ${label}: ${rErr.message}`)
  }
  manifest.users[label] = { id: data.user.id, email, role }
  return { id: data.user.id, email, password: PASSWORD }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  const staff = await createUser('staff', 'staff')
  const staffTotpSecret = await enrollStaffTotp(staff.email, staff.password)
  const owner = await createUser('owner', 'company_admin')
  const individual = await createUser('individual', 'individual')
  const applicantBiz = await createUser('applicant-biz', 'individual')
  const applicantUni = await createUser('applicant-uni', 'individual')

  const companyId = randomUUID()
  const slug = `synth-06e-${RUN_ID}`
  const { error: cErr } = await admin.from('companies').insert({
    id: companyId,
    name: `SYNTH 06E Co ${RUN_ID}`,
    name_ar: `شركة تجريبية جيد-06هـ ${RUN_ID}`,
    domains: [`${slug}.test`],
    entity_type: 'business',
    is_verified: true,
    is_active: true,
    slug,
    city: 'Riyadh',
    website_url: 'https://synth-before.example.test',
  })
  if (cErr) throw new Error(`company: ${cErr.message}`)
  manifest.companies.primary = { id: companyId, slug, cityBefore: 'Riyadh' }

  const { data: bp, error: bpErr } = await admin
    .from('business_profiles')
    .insert({
      directory_id: companyId,
      owner_user_id: owner.id,
      display_name_ar: `ملف تجريبي ${RUN_ID}`,
      display_name_en: `Synth Profile ${RUN_ID}`,
      status: 'published',
      verified_domains: [`${slug}.test`],
    })
    .select('id')
    .single()
  if (bpErr || !bp) throw new Error(`business_profile: ${bpErr?.message}`)
  manifest.profiles.business = { id: bp.id, ownerId: owner.id, directoryId: companyId }

  const uniDirId = randomUUID()
  const uniSlug = `synth-06e-uni-${RUN_ID}`
  const { error: uErr } = await admin.from('companies').insert({
    id: uniDirId,
    name: `SYNTH 06E Uni ${RUN_ID}`,
    name_ar: `جامعة تجريبية جيد-06هـ ${RUN_ID}`,
    domains: [`${uniSlug}.test`],
    entity_type: 'university',
    is_verified: true,
    is_active: true,
    slug: uniSlug,
  })
  if (uErr) throw new Error(`uni dir: ${uErr.message}`)
  manifest.companies.university = { id: uniDirId, slug: uniSlug }

  async function insertSuggestion(key, field, value, status = 'pending') {
    const id = randomUUID()
    const { error } = await admin.from('directory_correction_suggestions').insert({
      id,
      directory_id: companyId,
      suggested_by: owner.id,
      field_name: field,
      current_value: 'Riyadh',
      suggested_value: value,
      reason: `SYNTH ${RUN_ID} ${key}`,
      status,
    })
    if (error) throw new Error(`suggestion ${key}: ${error.message}`)
    manifest.suggestions[key] = { id, field, value, status }
    return id
  }

  await insertSuggestion('approve', 'city', `Jeddah-SYNTH-${RUN_ID}`)
  await insertSuggestion('reject', 'website_url', `https://synth-reject-${RUN_ID}.example.test`)
  await insertSuggestion('already_decided', 'linkedin_url', `https://linkedin.example/${RUN_ID}`, 'approved')

  // Orphan-directory pending suggestion for missing-target honest failure (helper).
  const orphanId = randomUUID()
  const missingDirId = randomUUID()
  const { error: orphanErr } = await admin.rpc('rls_test_insert_orphan_correction_suggestion', {
    p_id: orphanId,
    p_directory_id: missingDirId,
    p_suggested_by: owner.id,
    p_field_name: 'city',
    p_current_value: 'Riyadh',
    p_suggested_value: `Missing-${RUN_ID}`,
    p_reason: `SYNTH orphan ${RUN_ID}`,
  })
  if (orphanErr) {
    console.warn('orphan_helper_unavailable', orphanErr.message)
  } else {
    manifest.suggestions.missing_target = { id: orphanId, directoryId: missingDirId }
  }

  async function insertVerification(key, applicantId, directoryId, type, status) {
    const id = randomUUID()
    const { error } = await admin.from('verification_requests').insert({
      id,
      applicant_user_id: applicantId,
      directory_id: directoryId,
      verification_type: type,
      company_name: `SYNTH VR ${key} ${RUN_ID}`,
      status,
      business_email: `${key}@${slug}.test`,
      claimant_name: `SYNTH Claimant ${RUN_ID}`,
      claimant_title: 'Representative',
      evidence_urls: [],
      rejection_reason: status === 'rejected' ? `SYNTH reason ${RUN_ID}` : null,
    })
    if (error) throw new Error(`verification ${key}: ${error.message}`)
    manifest.verifications[key] = { id, applicantId, type, status }
    return id
  }

  const bizApproveVr = await insertVerification(
    'biz_approve',
    applicantBiz.id,
    companyId,
    'business',
    'approved',
  )
  const bizRejectVr = await insertVerification(
    'biz_reject',
    applicantBiz.id,
    companyId,
    'business',
    'rejected',
  )
  const uniApproveVr = await insertVerification(
    'uni_approve',
    applicantUni.id,
    uniDirId,
    'university',
    'approved',
  )
  const uniRejectVr = await insertVerification(
    'uni_reject',
    applicantUni.id,
    uniDirId,
    'university',
    'rejected',
  )

  // Pre-seed claim notifications matching Session 06-D dispatch shape (for UI smoke
  // without requiring staff MFA to invoke notify_claim_decision during capture).
  // RPC proof remains covered by Session 06-D disposable matrix + optional staff call.
  async function insertClaimNotification(key, recipientId, category, actionUrl, titleAr, titleEn, bodyAr, bodyEn, vrId, decision) {
    const id = randomUUID()
    const { error } = await admin.from('notifications').insert({
      id,
      recipient_id: recipientId,
      category,
      priority: 'high',
      title_ar: titleAr,
      title_en: titleEn,
      body_ar: bodyAr,
      body_en: bodyEn,
      action_url: actionUrl,
      action_label_ar: actionUrl?.includes('create-profile')
        ? 'إنشاء الملف التعريفي'
        : 'عرض نتيجة الطلب',
      action_label_en: actionUrl?.includes('create-profile') ? 'Create profile' : 'View decision',
      related_resource_type: 'verification_request',
      related_resource_id: vrId,
      idempotency_key: `verification.decision:${vrId}:${decision}`,
      metadata: { verification_id: vrId, decision, synth_run: RUN_ID },
    })
    if (error) throw new Error(`notification ${key}: ${error.message}`)
    manifest.notifications[key] = { id, recipientId, category, actionUrl, vrId }
  }

  await insertClaimNotification(
    'biz_approve',
    applicantBiz.id,
    'claim.approved',
    '/company/create-profile',
    'تمت الموافقة على طلب التحقق',
    'Verification approved',
    `وافقت إدارة جيد على طلب التحقق الخاص بـ SYNTH. يمكنك الآن إنشاء ملفك التعريفي. (${RUN_ID})`,
    `JID staff approved your verification for SYNTH. You can now create your owned profile. (${RUN_ID})`,
    bizApproveVr,
    'approved',
  )
  await insertClaimNotification(
    'biz_reject',
    applicantBiz.id,
    'claim.rejected',
    '/company/verification-rejected',
    'تم رفض طلب التحقق',
    'Verification rejected',
    `لم يُقبل طلب التحقق.\n\nالسبب: SYNTH reason ${RUN_ID}`,
    `Your verification was not approved.\n\nReason: SYNTH reason ${RUN_ID}`,
    bizRejectVr,
    'rejected',
  )

  // Unknown category + missing action_url honest states (synthetic recipient = individual)
  const { error: unkErr } = await admin.from('notifications').insert({
    id: randomUUID(),
    recipient_id: individual.id,
    category: 'claim.needs_more_info',
    priority: 'normal',
    title_ar: '',
    title_en: '',
    body_ar: '',
    body_en: '',
    action_url: null,
    action_label_ar: null,
    action_label_en: null,
    related_resource_type: 'verification_request',
    related_resource_id: bizRejectVr,
    idempotency_key: `synth.unknown-empty:${RUN_ID}`,
    metadata: { synth_run: RUN_ID, purpose: 'empty_copy_fallback' },
  })
  if (unkErr) throw new Error(`empty notif: ${unkErr.message}`)

  const { error: blankUrlErr } = await admin.from('notifications').insert({
    id: randomUUID(),
    recipient_id: individual.id,
    category: 'claim.approved',
    priority: 'high',
    title_ar: 'إشعار بدون رابط',
    title_en: 'Notification without link',
    body_ar: 'حالة بدون action_url',
    body_en: 'State with blank action_url',
    action_url: '   ',
    action_label_ar: 'عرض',
    action_label_en: 'View',
    related_resource_type: 'verification_request',
    related_resource_id: bizApproveVr,
    idempotency_key: `synth.blank-url:${RUN_ID}`,
    metadata: { synth_run: RUN_ID, purpose: 'blank_action_url' },
  })
  if (blankUrlErr) throw new Error(`blank url notif: ${blankUrlErr.message}`)

  // Credentials file for capture only — gitignored path under scripts/.tmp
  const tmpDir = path.join(root, 'scripts/.tmp')
  fs.mkdirSync(tmpDir, { recursive: true })
  const secretsPath = path.join(tmpDir, 'spec-06e-secrets.json')
  fs.writeFileSync(
    secretsPath,
    JSON.stringify(
      {
        runId: RUN_ID,
        password: PASSWORD,
        staffTotpSecret,
        users: {
          staff: { ...manifest.users.staff, password: PASSWORD },
          owner: { ...manifest.users.owner, password: PASSWORD },
          individual: { ...manifest.users.individual, password: PASSWORD },
          applicantBiz: { ...manifest.users['applicant-biz'], password: PASSWORD },
          applicantUni: { ...manifest.users['applicant-uni'], password: PASSWORD },
        },
        companySlug: slug,
        suggestions: manifest.suggestions,
        notifications: manifest.notifications,
      },
      null,
      2,
    ),
  )

  // Public manifest — no passwords
  fs.writeFileSync(path.join(outDir, 'run-manifest.json'), JSON.stringify(manifest, null, 2))
  console.log('FIXTURES_OK', RUN_ID)
  console.log('SECRETS', secretsPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
