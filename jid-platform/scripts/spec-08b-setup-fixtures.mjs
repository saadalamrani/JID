/**
 * Spec 08-B — run-scoped dashboard fixtures on disposable local Supabase.
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const secretsDir = path.join(root, 'scripts/.tmp')
const evidenceDir = path.join(root, 'docs/command-center/reports/ui-evidence/w-dashboards')

function loadEnvLocal() {
  const values = {}
  const text = fs.readFileSync(path.join(root, '.env.local'), 'utf8').replace(/^\uFEFF/, '')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    values[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return values
}

function assertLocal(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) throw new Error('Missing local Supabase env')
  const host = new URL(url).hostname
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
    throw new Error(`Refusing non-local URL ${url}`)
  }
  return { url, anon, service }
}

const RUN_ID = `jid08b-${Date.now()}`
const PASSWORD = `Jid08b!${RUN_ID.slice(-6)}A1`

async function main() {
  const env = assertLocal(loadEnvLocal())
  const admin = createClient(env.url, env.service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  fs.mkdirSync(secretsDir, { recursive: true })
  fs.mkdirSync(evidenceDir, { recursive: true })

  async function createUser(email, role) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { run_id: RUN_ID },
    })
    if (error) throw error
    const id = data.user.id
    const { error: profileError } = await admin.from('profiles').upsert({
      id,
      role,
      full_name: `Synth ${role} ${RUN_ID}`,
    })
    if (profileError) throw profileError
    return { id, email }
  }

  const businessOwner = await createUser(`biz-owner-${RUN_ID}@example.invalid`, 'company_admin')
  const universityOwner = await createUser(
    `uni-owner-${RUN_ID}@example.invalid`,
    'university_admin',
  )

  const bizDirId = randomUUID()
  const uniDirId = randomUUID()
  const bizSlug = `synth-08b-biz-${RUN_ID}`
  const uniSlug = `synth-08b-uni-${RUN_ID}`
  const uniShort = `S8B${String(Date.now()).slice(-4)}`

  const { error: bizDirErr } = await admin.from('companies').insert({
    id: bizDirId,
    name: `Synth Biz ${RUN_ID}`,
    name_ar: `منشأة اصطناعية ${RUN_ID}`,
    slug: bizSlug,
    entity_type: 'business',
    entity_state: 'approved',
    is_active: true,
  })
  if (bizDirErr) throw bizDirErr

  const { error: uniDirErr } = await admin.from('companies').insert({
    id: uniDirId,
    name: `Synth Uni ${RUN_ID}`,
    name_ar: `جامعة اصطناعية ${RUN_ID}`,
    slug: uniSlug,
    entity_type: 'university',
    entity_state: 'approved',
    is_active: true,
    university_short_code: uniShort,
    // Fixture-only: existing deferred view still gates on claimed_by.
    claimed_by: universityOwner.id,
  })
  if (uniDirErr) throw uniDirErr

  const bizProfileId = randomUUID()
  const { error: bizProfErr } = await admin.from('business_profiles').insert({
    id: bizProfileId,
    directory_id: bizDirId,
    owner_user_id: businessOwner.id,
    status: 'published',
    display_name_ar: `منشأة لوحة ${RUN_ID}`,
    display_name_en: `Dash Biz ${RUN_ID}`,
    about_ar: 'نبذة اصطناعية للاختبار فقط',
    published_at: new Date().toISOString(),
  })
  if (bizProfErr) throw bizProfErr

  const uniProfileId = randomUUID()
  const { error: uniProfErr } = await admin.from('university_profiles').insert({
    id: uniProfileId,
    directory_id: uniDirId,
    owner_user_id: universityOwner.id,
    status: 'published',
    display_name_ar: `جامعة لوحة ${RUN_ID}`,
    display_name_en: `Dash Uni ${RUN_ID}`,
    about_ar: 'نبذة جامعية اصطناعية',
    published_at: new Date().toISOString(),
  })
  if (uniProfErr) throw uniProfErr

  // Zero-state first: no jobs. Capture scripts may add jobs for populated state.
  const secrets = {
    runId: RUN_ID,
    password: PASSWORD,
    businessOwner,
    universityOwner,
    directories: { business: bizDirId, university: uniDirId },
    profiles: { business: bizProfileId, university: uniProfileId },
    slugs: { business: bizSlug, university: uniSlug },
    uniShort,
  }
  fs.writeFileSync(path.join(secretsDir, 'spec-08b-secrets.json'), JSON.stringify(secrets, null, 2))
  fs.writeFileSync(
    path.join(evidenceDir, 'run-manifest.json'),
    JSON.stringify(
      {
        runId: RUN_ID,
        users: {
          businessOwner: { id: businessOwner.id },
          universityOwner: { id: universityOwner.id },
        },
        directories: secrets.directories,
        profiles: secrets.profiles,
        slugs: secrets.slugs,
      },
      null,
      2,
    ),
  )
  console.log(`SETUP_OK ${RUN_ID}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
