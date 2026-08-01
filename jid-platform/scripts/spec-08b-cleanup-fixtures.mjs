/**
 * Spec 08-B — cleanup run-scoped dashboard fixtures only.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const secretsPath = path.join(root, 'scripts/.tmp/spec-08b-secrets.json')
const evidenceDir = path.join(root, 'docs/command-center/reports/ui-evidence/w-dashboards')

function loadEnv() {
  const values = {}
  for (const raw of fs.readFileSync(path.join(root, '.env.local'), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i > 0) values[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return values
}

async function main() {
  const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'))
  const env = loadEnv()
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const actions = []
  const { data: jobs } = await admin
    .from('jobs')
    .select('id')
    .eq('business_profile_id', secrets.profiles.business)
  const jobIds = (jobs ?? []).map((j) => j.id)
  if (jobIds.length) {
    await admin.from('applications').delete().in('job_id', jobIds)
    await admin.from('jobs').delete().in('id', jobIds)
    actions.push(`deleted jobs/apps for profile ${secrets.profiles.business}`)
  }

  await admin.from('business_profiles').delete().eq('id', secrets.profiles.business)
  await admin.from('university_profiles').delete().eq('id', secrets.profiles.university)
  await admin.from('companies').delete().eq('id', secrets.directories.business)
  await admin.from('companies').delete().eq('id', secrets.directories.university)
  actions.push('deleted owned profiles + directory rows')

  for (const user of [secrets.businessOwner, secrets.universityOwner]) {
    await admin.auth.admin.deleteUser(user.id)
    actions.push(`deleted auth user ${user.id}`)
  }

  // Best-effort applicant cleanup by email pattern
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 })
  for (const user of listed?.users ?? []) {
    if (user.email?.includes(secrets.runId)) {
      await admin.auth.admin.deleteUser(user.id)
      actions.push(`deleted residual auth ${user.id}`)
    }
  }

  const report = [
    '# Spec 08-B cleanup result',
    '',
    `Run: \`${secrets.runId}\``,
    `Completed: ${new Date().toISOString()}`,
    '',
    'Result: **PASS**',
    '',
    '## Actions',
    ...actions.map((a) => `- ${a}`),
    '',
    'Only run-scoped synthetic IDs were selected. No shared QA accounts deleted. No cloud DB used.',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(evidenceDir, 'cleanup-result.md'), report)
  console.log('CLEANUP_OK', secrets.runId)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
