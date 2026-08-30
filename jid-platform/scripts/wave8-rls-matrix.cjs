/**
 * Wave 8 RLS/privacy actor matrix against jid-nonprod.
 * All fixture writes run inside a transaction that always rolls back.
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function readEnv(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const out = {}
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
    const idx = line.indexOf('=')
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
  }
  return out
}

async function main() {
  const root = path.resolve(__dirname, '..')
  const env = readEnv(path.join(root, '.env.seed.nonprod'))
  const dbUrl = env.SEED_DATABASE_URL
  if (!dbUrl.includes('hmjuijmaefajdjrjdsxu')) throw new Error('refusing unknown host')
  if (dbUrl.includes('znfhladafpajyjwcfzvv')) throw new Error('refusing production')

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  const failures = []
  const pass = (name) => process.stdout.write('PASS ' + name + '\n')
  const fail = (name, detail) => {
    failures.push(name + ': ' + detail)
    process.stdout.write('FAIL ' + name + ' — ' + detail + '\n')
  }

  try {
    const staticSql = fs.readFileSync(path.join(root, 'tests/rls/wave8-talent-sourcing.matrix.sql'), 'utf8')
    await client.query(staticSql)
    pass('static-privileges-and-no-application-insert')

    await client.query('begin')
    const users = await client.query(`
      select u.id, u.email, p.role
      from auth.users u
      join public.profiles p on p.id = u.id
      where u.email in (
        'business-verified@jidseed.test',
        'individual-complete@jidseed.test',
        'individual-new@jidseed.test',
        'university-verified@jidseed.test'
      )
    `)
    const byEmail = Object.fromEntries(users.rows.map((row) => [row.email, row]))
    const biz = byEmail['business-verified@jidseed.test']
    const disc = byEmail['individual-complete@jidseed.test']
    const priv = byEmail['individual-new@jidseed.test']
    const uni = byEmail['university-verified@jidseed.test']
    if (!biz || !disc || !priv || !uni) {
      throw new Error('seed actors missing: ' + Object.keys(byEmail).join(','))
    }

    await client.query(
      `update public.profiles
          set visibility = 'discoverable',
              show_profile_to_companies = true,
              role = 'individual',
              profile_state = 'active',
              deleted_at = null,
              suspended_at = null,
              headline = 'SQL analyst'
        where id = $1`,
      [disc.id],
    )
    await client.query(
      `update public.profiles
          set visibility = 'private',
              show_profile_to_companies = false,
              role = 'individual',
              profile_state = 'active'
        where id = $1`,
      [priv.id],
    )

    const discoverable = await client.query('select public.is_professionally_discoverable($1) as ok', [disc.id])
    const hidden = await client.query('select public.is_professionally_discoverable($1) as ok', [priv.id])
    if (discoverable.rows[0].ok === true) pass('discoverable-individual-true')
    else fail('discoverable-individual-true', String(discoverable.rows[0].ok))
    if (hidden.rows[0].ok === false) pass('non-discoverable-individual-false')
    else fail('non-discoverable-individual-false', String(hidden.rows[0].ok))

    const job2 = await client.query(
      `select j.id, j.title_ar, j.title_en
         from public.jobs j
         join public.business_profiles bp on bp.id = j.business_profile_id
        where bp.owner_user_id = $1
        limit 1`,
      [biz.id],
    )

    const claims = (userId, email) =>
      client.query(`select set_config('request.jwt.claims', $1, true)`, [
        JSON.stringify({ sub: userId, role: 'authenticated', email }),
      ])

    if (job2.rows.length === 0) {
      fail('verified-employer-job', 'no owned job')
    } else {
      const jobId = job2.rows[0].id
      await claims(biz.id, biz.email)
      try {
        await client.query('select public.initialize_hiring_role($1, $2, $3)', [
          jobId,
          job2.rows[0].title_ar || 'دور',
          job2.rows[0].title_en || 'Role',
        ])
        pass('initialize-hiring-role')
      } catch (error) {
        fail('initialize-hiring-role', error.message)
      }
      const role = await client.query('select id from public.hiring_roles where job_id = $1', [jobId])
      if (role.rows[0]) {
        await client.query(
          `insert into public.hiring_criteria (hiring_role_id, label_ar, label_en, required, sort_order, evidence_kinds)
           values ($1, 'SQL', 'SQL', false, 0, '{}')
           on conflict (hiring_role_id, sort_order) do nothing`,
          [role.rows[0].id],
        )
      }
      try {
        const search = await client.query('select public.search_discoverable_talent($1) as payload', [jobId])
        const payload = search.rows[0].payload
        const ids = (payload.candidates || []).map((row) => row.profileId)
        if (!ids.includes(priv.id)) pass('non-discoverable-absent-from-search')
        else fail('non-discoverable-absent-from-search', 'private person leaked')
        const blob = JSON.stringify(payload)
        if (!blob.includes('@jidseed.test')) pass('no-contact-leak-in-search')
        else fail('no-contact-leak-in-search', 'email present')
        pass('verified-employer-search-executes')
        try {
          const invite = await client.query(
            'select public.invite_discoverable_talent($1, $2, $3, $4) as id',
            [jobId, disc.id, 'اهتمام بالتوظيف لهذا الدور.', 'Hiring interest for this role.'],
          )
          const invitationId = invite.rows[0].id
          const apps = await client.query(
            "select count(*)::int as n from public.applications where applicant_id = $1 and created_at > now() - interval '1 minute'",
            [disc.id],
          )
          if (apps.rows[0].n === 0) pass('invitation-does-not-create-application')
          else fail('invitation-does-not-create-application', 'application inserted')

          await client.query('set local role authenticated')
          await claims(uni.id, uni.email)
          const uniRead = await client.query(
            'select count(*)::int as n from public.talent_sourcing_invitations where id = $1',
            [invitationId],
          )
          await client.query('reset role')
          if (uniRead.rows[0].n === 0) pass('university-denied-invitations')
          else fail('university-denied-invitations', 'university saw invitation')

          await client.query('set local role authenticated')
          await claims(disc.id, disc.email)
          const own = await client.query(
            'select count(*)::int as n from public.talent_sourcing_invitations where id = $1',
            [invitationId],
          )
          await client.query('reset role')
          if (own.rows[0].n === 1) pass('candidate-reads-own-invitation')
          else fail('candidate-reads-own-invitation', String(own.rows[0].n))
          await client.query("select public.respond_talent_invitation($1, 'interested')", [invitationId])
          const stillApps = await client.query(
            'select count(*)::int as n from public.applications a join public.talent_sourcing_invitations i on i.application_id = a.id where i.id = $1',
            [invitationId],
          )
          if (stillApps.rows[0].n === 0) pass('interested-does-not-create-application')
          else fail('interested-does-not-create-application', 'linked application')
        } catch (error) {
          fail('invitation-flow', error.message)
        }
      } catch (error) {
        fail('search-as-verified-employer', error.message)
      }

      await claims(uni.id, uni.email)
      try {
        await client.query('select public.search_discoverable_talent($1)', [jobId])
        fail('university-search-denied', 'unexpected success')
      } catch {
        pass('university-search-denied')
      }
    }

    await client.query('rollback')
    pass('rollback-no-persist')
  } catch (error) {
    try {
      await client.query('rollback')
    } catch {
      /* ignore */
    }
    fail('matrix-runner', error.message)
  } finally {
    await client.end()
  }

  if (failures.length) {
    process.stderr.write(failures.join('\n') + '\n')
    process.exit(1)
  }
  process.stdout.write('WAVE8_RLS_MATRIX PASS\n')
}

main().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n')
  process.exit(1)
})
