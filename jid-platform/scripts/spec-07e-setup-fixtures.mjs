/**
 * Spec 07-E — create run-scoped publication fixtures on disposable local Supabase.
 * Public evidence receives IDs only; credentials stay in gitignored scripts/.tmp/.
 */
import { createClient } from '@supabase/supabase-js'
import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const evidenceDir = path.join(root, 'docs/command-center/reports/ui-evidence/spec-07')
const secretsDir = path.join(root, 'scripts/.tmp')

function loadEnvLocal() {
  const values = {}
  const text = fs.readFileSync(path.join(root, '.env.local'), 'utf8').replace(/^\uFEFF/, '')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator < 0) continue
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return values
}

function decodeJwtPayload(token) {
  const payload = token.split('.')[1]
  if (!payload) throw new Error('Invalid Supabase JWT')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

function assertDisposableLocalEnv(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  const parsed = new URL(url)
  if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname)) {
    throw new Error(`Refusing non-local Supabase URL: ${parsed.origin}`)
  }

  const anonClaims = decodeJwtPayload(anon)
  const serviceClaims = decodeJwtPayload(service)
  if (anonClaims.iss !== 'supabase-demo' || anonClaims.role !== 'anon') {
    throw new Error('Refusing non-demo Supabase anon JWT')
  }
  if (serviceClaims.iss !== 'supabase-demo' || serviceClaims.role !== 'service_role') {
    throw new Error('Refusing non-demo Supabase service-role JWT')
  }

  return { url, anon, service }
}

function base32ToBuffer(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleaned = secret.replace(/=+$/, '').toUpperCase()
  let bits = ''
  for (const character of cleaned) {
    const value = alphabet.indexOf(character)
    if (value >= 0) bits += value.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2))
  }
  return Buffer.from(bytes)
}

function totp(secret, step = 30, digits = 6) {
  const counter = Math.floor(Date.now() / 1000 / step)
  const buffer = Buffer.alloc(8)
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buffer.writeUInt32BE(counter & 0xffffffff, 4)
  const hmac = createHmac('sha1', base32ToBuffer(secret)).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const value =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(value % 10 ** digits).padStart(digits, '0')
}

const env = loadEnvLocal()
const local = assertDisposableLocalEnv(env)
const admin = createClient(local.url, local.service, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const RUN_ID = `jid07e-${Date.now()}`
const PASSWORD = `Jid07e!${randomBytes(12).toString('base64url')}`

async function createUser(label, role) {
  const id = randomUUID()
  const email = `${label}-${RUN_ID}@jid.local.test`
  const { data, error } = await admin.auth.admin.createUser({
    id,
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (error || !data.user) {
    throw new Error(`Create ${label} user: ${error?.message ?? 'no user returned'}`)
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id,
    full_name: `SYNTH 07E ${label} ${RUN_ID}`,
    locale: 'ar',
    visibility: 'private',
    show_profile_to_companies: false,
    profile_state: 'active',
  })
  if (profileError) throw new Error(`Create ${label} profile: ${profileError.message}`)

  const { error: roleError } = await admin.rpc('rls_test_set_user_role', {
    p_target_user_id: id,
    p_new_role: role,
  })
  if (roleError) throw new Error(`Assign ${label} role: ${roleError.message}`)

  return { id, email, role }
}

async function enrollStaffTotp(staff) {
  const client = createClient(local.url, local.anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const signedIn = await client.auth.signInWithPassword({
    email: staff.email,
    password: PASSWORD,
  })
  if (signedIn.error || !signedIn.data.session) {
    throw new Error(`Staff sign-in for MFA: ${signedIn.error?.message ?? 'no session'}`)
  }

  const enrolled = await client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `spec-07e-${RUN_ID}`,
  })
  if (enrolled.error || !enrolled.data?.totp?.secret) {
    throw new Error(`Staff MFA enroll: ${enrolled.error?.message ?? 'no TOTP secret'}`)
  }

  const challenged = await client.auth.mfa.challenge({ factorId: enrolled.data.id })
  if (challenged.error) throw new Error(`Staff MFA challenge: ${challenged.error.message}`)
  const verified = await client.auth.mfa.verify({
    factorId: enrolled.data.id,
    challengeId: challenged.data.id,
    code: totp(enrolled.data.totp.secret),
  })
  if (verified.error) throw new Error(`Staff MFA verify: ${verified.error.message}`)
  await client.auth.signOut()
  return enrolled.data.totp.secret
}

async function createDirectory(kind) {
  const id = randomUUID()
  const isBusiness = kind === 'business'
  const slug = `synth-07e-${isBusiness ? 'biz' : 'uni'}-${RUN_ID}`
  const { error } = await admin.from('companies').insert({
    id,
    slug,
    name: `SYNTH 07E ${isBusiness ? 'Business' : 'University'} ${RUN_ID}`,
    name_ar: `${isBusiness ? 'شركة' : 'جامعة'} اصطناعية 07E ${RUN_ID}`,
    domains: [`${slug}.test`],
    entity_type: kind,
    is_verified: true,
    is_active: true,
  })
  if (error) throw new Error(`Create ${kind} Directory row: ${error.message}`)
  return { id, slug }
}

async function createOwnedProfile(kind, ownerId, directory) {
  const table = kind === 'business' ? 'business_profiles' : 'university_profiles'
  const label = kind === 'business' ? 'منشأة اصطناعية' : 'جامعة اصطناعية'
  const english = kind === 'business' ? 'Synthetic Business' : 'Synthetic University'
  const { data, error } = await admin
    .from(table)
    .insert({
      owner_user_id: ownerId,
      directory_id: directory.id,
      display_name_ar: `${label} 07E ${RUN_ID}`,
      display_name_en: `${english} 07E ${RUN_ID}`,
      about_ar: null,
      about_en: null,
      status: 'draft',
      verified_domains: [`${directory.slug}.test`],
    })
    .select('id')
    .single()
  if (error || !data) {
    throw new Error(`Create ${kind} Profile: ${error?.message ?? 'no row returned'}`)
  }
  return { id: data.id }
}

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.mkdirSync(secretsDir, { recursive: true })

  const businessOwner = await createUser('business-owner', 'company_admin')
  const universityOwner = await createUser('university-owner', 'university_admin')
  const staff = await createUser('staff', 'staff')
  const staffTotpSecret = await enrollStaffTotp(staff)

  const businessDirectory = await createDirectory('business')
  const universityDirectory = await createDirectory('university')
  const businessProfile = await createOwnedProfile(
    'business',
    businessOwner.id,
    businessDirectory,
  )
  const universityProfile = await createOwnedProfile(
    'university',
    universityOwner.id,
    universityDirectory,
  )

  const manifest = {
    runId: RUN_ID,
    createdAt: new Date().toISOString(),
    users: {
      businessOwner: { id: businessOwner.id },
      universityOwner: { id: universityOwner.id },
      staff: { id: staff.id },
    },
    directories: {
      business: { id: businessDirectory.id },
      university: { id: universityDirectory.id },
    },
    profiles: {
      business: { id: businessProfile.id },
      university: { id: universityProfile.id },
    },
  }

  const secrets = {
    runId: RUN_ID,
    password: PASSWORD,
    staffTotpSecret,
    users: {
      businessOwner: { ...businessOwner, password: PASSWORD },
      universityOwner: { ...universityOwner, password: PASSWORD },
      staff: { ...staff, password: PASSWORD },
    },
    directories: {
      business: businessDirectory,
      university: universityDirectory,
    },
    profiles: {
      business: businessProfile,
      university: universityProfile,
    },
  }

  fs.writeFileSync(
    path.join(secretsDir, 'spec-07e-secrets.json'),
    JSON.stringify(secrets, null, 2),
    { mode: 0o600 },
  )
  fs.writeFileSync(
    path.join(evidenceDir, 'run-manifest.json'),
    JSON.stringify(manifest, null, 2),
  )

  console.log('FIXTURES_OK', RUN_ID)
  console.log('MANIFEST', path.join(evidenceDir, 'run-manifest.json'))
  console.log('SECRETS', path.join(secretsDir, 'spec-07e-secrets.json'))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
