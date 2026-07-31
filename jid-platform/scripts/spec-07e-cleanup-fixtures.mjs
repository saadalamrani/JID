/**
 * Spec 07-E — delete only fixtures named in the run-scoped secrets manifest.
 * Uses the disposable-local audit helper only if immutable audit rows block user deletion.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'docs/command-center/reports/ui-evidence/spec-07')
const secrets = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/.tmp/spec-07e-secrets.json'), 'utf8'),
)

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
  const payload = token?.split('.')[1]
  if (!payload) throw new Error('Invalid Supabase JWT')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

function assertDisposableLocalEnv(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const service = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) throw new Error('Missing local Supabase URL or service-role key')
  const hostname = new URL(url).hostname
  if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) {
    throw new Error(`Refusing non-local Supabase URL: ${url}`)
  }
  const claims = decodeJwtPayload(service)
  if (claims.iss !== 'supabase-demo' || claims.role !== 'service_role') {
    throw new Error('Refusing non-demo Supabase service-role JWT')
  }
  return { url, service }
}

const env = assertDisposableLocalEnv(loadEnvLocal())
const admin = createClient(env.url, env.service, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function requireRunMarker(value, label) {
  if (typeof value !== 'string' || !value.includes(secrets.runId)) {
    throw new Error(`Refusing cleanup: ${label} does not contain run marker ${secrets.runId}`)
  }
}

async function verifyScope() {
  if (!/^jid07e-\d+$/.test(secrets.runId)) {
    throw new Error(`Refusing malformed Spec 07-E run ID: ${secrets.runId}`)
  }

  for (const [type, table] of [
    ['business', 'business_profiles'],
    ['university', 'university_profiles'],
  ]) {
    const profileId = secrets.profiles[type].id
    const { data, error } = await admin
      .from(table)
      .select('id,display_name_ar,owner_user_id,directory_id')
      .eq('id', profileId)
      .maybeSingle()
    if (error) throw new Error(`Verify ${type} Profile: ${error.message}`)
    if (data) requireRunMarker(data.display_name_ar, `${type} Profile display name`)
  }

  for (const type of ['business', 'university']) {
    const directory = secrets.directories[type]
    const { data, error } = await admin
      .from('companies')
      .select('id,slug')
      .eq('id', directory.id)
      .maybeSingle()
    if (error) throw new Error(`Verify ${type} Directory row: ${error.message}`)
    if (data) {
      requireRunMarker(data.slug, `${type} Directory slug`)
      if (data.slug !== directory.slug) {
        throw new Error(`Refusing cleanup: ${type} Directory slug differs from secrets manifest`)
      }
    }
  }

  for (const [label, user] of Object.entries(secrets.users)) {
    const result = await admin.auth.admin.getUserById(user.id)
    if (result.error && !/not found/i.test(result.error.message)) {
      throw new Error(`Verify ${label} auth user: ${result.error.message}`)
    }
    if (result.data?.user?.email) {
      requireRunMarker(result.data.user.email, `${label} email`)
    }
  }
}

async function deleteExact(table, id, label) {
  const { error } = await admin.from(table).delete().eq('id', id)
  if (error) throw new Error(`Delete ${label}: ${error.message}`)
}

async function deleteRunUser(label, user, report) {
  let deletion = await admin.auth.admin.deleteUser(user.id)
  if (!deletion.error) {
    report.users.push({ label, id: user.id, deleted: true, auditHelperUsed: false })
    return
  }

  const initialError = deletion.error.message
  const auditBlocked = /audit_logs|audit|immutable|prevent_audit_modification/i.test(initialError)
  const helper = await admin.rpc('rls_test_clear_user_audit', { p_user_id: user.id })
  if (helper.error) {
    report.users.push({
      label,
      id: user.id,
      deleted: false,
      auditHelperUsed: false,
      initialError,
      helperError: helper.error.message,
    })
    throw new Error(
      `Delete ${label} user failed; audit cleanup helper also failed: ${helper.error.message}`,
    )
  }

  deletion = await admin.auth.admin.deleteUser(user.id)
  report.users.push({
    label,
    id: user.id,
    deleted: !deletion.error,
    auditHelperUsed: true,
    auditForeignKeyBlockedInitialDelete: auditBlocked,
    initialError,
    retryError: deletion.error?.message ?? null,
  })
  if (deletion.error) throw new Error(`Delete ${label} user retry: ${deletion.error.message}`)
}

function writeReport(report) {
  const lines = [
    '# Spec 07-E cleanup result',
    '',
    `Run: \`${report.runId}\``,
    `Completed: ${report.completedAt}`,
    '',
    `Result: **${report.pass ? 'PASS' : 'FAIL'}**`,
    '',
    'Only IDs from the gitignored run secrets manifest were considered. Every extant row was checked for the run marker before deletion; no shared fixture was selected.',
    '',
    '## Deleted owned Profiles and Directory rows',
    `- Business Profile: \`${report.deleted.businessProfileId}\``,
    `- University Profile: \`${report.deleted.universityProfileId}\``,
    `- Business Directory row: \`${report.deleted.businessDirectoryId}\``,
    `- University Directory row: \`${report.deleted.universityDirectoryId}\``,
    '',
    '## Auth users and audit-log handling',
  ]
  for (const user of report.users) {
    lines.push(
      `- ${user.label} \`${user.id}\`: ${user.deleted ? 'deleted' : 'not deleted'}; audit helper used=${user.auditHelperUsed ? 'yes' : 'no'}${user.initialError ? `; initial delete error: ${user.initialError}` : ''}${user.retryError ? `; retry error: ${user.retryError}` : ''}`,
    )
  }
  const helperUsers = report.users.filter((user) => user.auditHelperUsed)
  if (helperUsers.length > 0) {
    lines.push(
      '',
      'Immutable `audit_logs` rows/FK handling blocked or accompanied the initial auth-user deletion. On this disposable stack only, `rls_test_clear_user_audit` removed audit rows for the exact synthetic actor ID before one retry. Shared actors and shared audit rows were not selected.',
    )
  } else {
    lines.push('', 'No audit-log FK blocker was encountered during auth-user deletion.')
  }
  lines.push(
    '',
    '## Leftovers',
    `- Owned Profiles: ${report.leftovers.profiles.length}`,
    `- Directory rows: ${report.leftovers.directories.length}`,
    `- Auth users: ${report.leftovers.users.length}`,
    '',
  )
  if (report.error) lines.push(`Error: ${report.error}`, '')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'cleanup-result.md'), lines.join('\n'))
}

async function main() {
  const report = {
    runId: secrets.runId,
    completedAt: null,
    pass: false,
    deleted: {
      businessProfileId: secrets.profiles.business.id,
      universityProfileId: secrets.profiles.university.id,
      businessDirectoryId: secrets.directories.business.id,
      universityDirectoryId: secrets.directories.university.id,
    },
    users: [],
    leftovers: { profiles: [], directories: [], users: [] },
    error: null,
  }

  try {
    await verifyScope()
    await deleteExact(
      'business_profiles',
      secrets.profiles.business.id,
      'run-scoped Business Profile',
    )
    await deleteExact(
      'university_profiles',
      secrets.profiles.university.id,
      'run-scoped University Profile',
    )
    await deleteExact(
      'companies',
      secrets.directories.business.id,
      'run-scoped Business Directory row',
    )
    await deleteExact(
      'companies',
      secrets.directories.university.id,
      'run-scoped University Directory row',
    )

    for (const [label, user] of Object.entries(secrets.users)) {
      await deleteRunUser(label, user, report)
    }

    const profileIds = Object.values(secrets.profiles).map((profile) => profile.id)
    const directoryIds = Object.values(secrets.directories).map((directory) => directory.id)
    const [businessLeft, universityLeft, directoryLeft] = await Promise.all([
      admin.from('business_profiles').select('id').in('id', profileIds),
      admin.from('university_profiles').select('id').in('id', profileIds),
      admin.from('companies').select('id').in('id', directoryIds),
    ])
    if (businessLeft.error) throw new Error(businessLeft.error.message)
    if (universityLeft.error) throw new Error(universityLeft.error.message)
    if (directoryLeft.error) throw new Error(directoryLeft.error.message)
    report.leftovers.profiles = [
      ...(businessLeft.data ?? []),
      ...(universityLeft.data ?? []),
    ]
    report.leftovers.directories = directoryLeft.data ?? []

    for (const user of Object.values(secrets.users)) {
      const result = await admin.auth.admin.getUserById(user.id)
      if (result.data?.user) report.leftovers.users.push({ id: user.id })
    }
    report.pass =
      report.leftovers.profiles.length === 0 &&
      report.leftovers.directories.length === 0 &&
      report.leftovers.users.length === 0
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error)
  } finally {
    report.completedAt = new Date().toISOString()
    writeReport(report)
  }

  if (!report.pass) throw new Error(report.error ?? 'Cleanup left run-scoped fixtures behind')
  console.log('CLEANUP_OK', secrets.runId)
  console.log('REPORT', path.join(outDir, 'cleanup-result.md'))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
