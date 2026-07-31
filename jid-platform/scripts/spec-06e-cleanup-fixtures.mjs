import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
function loadEnv() {
  const map = {}
  const t = fs.readFileSync(path.join(root, '.env.local'), 'utf8').replace(/^\uFEFF/, '')
  for (const line of t.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    map[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return map
}
const env = loadEnv()
const secrets = JSON.parse(fs.readFileSync(path.join(root, 'scripts/.tmp/spec-06e-secrets.json'), 'utf8'))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const runId = secrets.runId
const userIds = Object.values(secrets.users).map((u) => u.id)
const companySlug = secrets.companySlug

const beforeCompanies = await admin.from('companies').select('id,slug,city,website_url').like('slug', `synth-06e%${runId}%`)
const suggestionIds = Object.values(secrets.suggestions).map((s) => s.id).filter(Boolean)
const notifIds = Object.values(secrets.notifications || {}).map((n) => n.id).filter(Boolean)

// Delete run-scoped rows only
if (suggestionIds.length) await admin.from('directory_correction_suggestions').delete().in('id', suggestionIds)
await admin.from('directory_correction_suggestions').delete().like('reason', `%${runId}%`)
if (notifIds.length) await admin.from('notifications').delete().in('id', notifIds)
await admin.from('notifications').delete().contains('metadata', { synth_run: runId })
await admin.from('verification_requests').delete().like('company_name', `%${runId}%`)
await admin.from('business_profiles').delete().like('display_name_en', `%${runId}%`)
await admin.from('companies').delete().like('slug', `%${runId}%`)

for (const id of userIds) {
  await admin.from('profiles').delete().eq('id', id)
  await admin.auth.admin.deleteUser(id)
}

const leftoverUsers = await admin.from('profiles').select('id,full_name').like('full_name', `%${runId}%`)
const leftoverCompanies = await admin.from('companies').select('id,slug').like('slug', `%${runId}%`)
const report = {
  runId,
  deletedUserCount: userIds.length,
  beforeCompanies: beforeCompanies.data,
  leftoverProfiles: leftoverUsers.data ?? [],
  leftoverCompanies: leftoverCompanies.data ?? [],
  notes: 'Only run-scoped synthetic objects removed. No shared/pre-existing rows deleted by ID outside this run.',
}
fs.writeFileSync(path.join(root, 'docs/command-center/reports/ui-evidence/spec-06/cleanup-result.json'), JSON.stringify(report, null, 2))
console.log('CLEANUP_OK', JSON.stringify(report))
