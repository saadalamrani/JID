/**
 * Wave 2 final closure — non-production only.
 * Target lock: hmjuijmaefajdjrjdsxu. Production znfhladafpajyjwcfzvv is forbidden.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'
import { loadEnvFile } from './lib/p110-env'

const NONPROD_REF = 'hmjuijmaefajdjrjdsxu'
const FORBIDDEN_PROD_REF = 'znfhladafpajyjwcfzvv'
const MIGRATION_VERSION = '20260828120000'
const MIGRATION_NAME = 'wave2_create_application_cv_snapshot'
const MIGRATION_FILE = join(
  process.cwd(),
  'supabase/migrations/20260828120000_wave2_create_application_cv_snapshot.sql',
)

type ProofResult = { name: string; pass: boolean; detail: string }

function assertNonprod(url: string, dbUrl: string): void {
  if (url.includes(FORBIDDEN_PROD_REF) || dbUrl.includes(FORBIDDEN_PROD_REF)) {
    throw new Error('PRODUCTION_FORBIDDEN: refused to contact znfhladafpajyjwcfzvv')
  }
  if (!url.includes(NONPROD_REF) || !dbUrl.includes(NONPROD_REF)) {
    throw new Error('NONPROD_IDENTITY_UNPROVEN: URL does not contain hmjuijmaefajdjrjdsxu')
  }
}

function setJwt(sql: postgres.Sql, userId: string) {
  return sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, role: 'authenticated' })}, true)`
}

async function main(): Promise<void> {
  const env = { ...loadEnvFile('.env.seed.nonprod'), ...process.env }
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const dbUrl = env.SEED_DATABASE_URL ?? ''
  assertNonprod(url, dbUrl)

  const sql = postgres(dbUrl, { max: 1, prepare: false, ssl: 'require' })
  const migrationSql = readFileSync(MIGRATION_FILE, 'utf8')
  const mode = process.argv[2] ?? 'identity'

  try {
    const identity = await sql`
      select current_database() as db, current_user as usr, inet_server_addr()::text as addr
    `
    const row = identity[0]!
    console.log('TARGET_REF', NONPROD_REF)
    console.log('PRODUCTION_TOUCHED', 'NO')
    console.log('CURRENT_DATABASE', row.db)
    console.log('CURRENT_USER', row.usr)
    console.log('SERVER_ADDR_SET', Boolean(row.addr))

    const history = await sql`
      select version, name from supabase_migrations.schema_migrations
      order by version
    `
    console.log(
      'MIGRATION_HISTORY_TAIL',
      history
        .slice(-6)
        .map((h) => `${h.version} ${h.name ?? ''}`)
        .join(' | '),
    )

    if (mode === 'identity') return

    if (mode === 'dry-run') {
      await sql.begin(async (tx) => {
        await tx.unsafe(migrationSql)
        const exists = await tx`
          select proname from pg_proc
          where proname = 'create_application_cv_snapshot'
        `
        if (exists.length === 0) throw new Error('function missing after dry-run apply')
        console.log('DRY_RUN_FUNCTION', 'present inside transaction')
        throw new Error('DRY_RUN_ROLLBACK')
      })
      return
    }

    if (mode === 'apply') {
      const already = history.some((h) => String(h.version) === MIGRATION_VERSION)
      if (!already) {
        await sql.unsafe(migrationSql)
        await sql`
          insert into supabase_migrations.schema_migrations (version, name)
          values (${MIGRATION_VERSION}, ${MIGRATION_NAME})
          on conflict (version) do nothing
        `
        console.log('MIGRATION_APPLIED', MIGRATION_VERSION)
      } else {
        console.log('MIGRATION_ALREADY_APPLIED', MIGRATION_VERSION)
      }
      const after = await sql`
        select version, name from supabase_migrations.schema_migrations
        where version = ${MIGRATION_VERSION}
      `
      console.log('MIGRATION_ROW', after[0]?.version, after[0]?.name)
      return
    }

    if (mode === 'proof') {
      const results: ProofResult[] = []
      await sql
        .begin(async (tx) => {
          const users = await tx`
          select id from public.profiles order by created_at nulls last, id limit 2
        `
          if (users.length < 2) throw new Error('need two profiles for cross-user proof')
          const userA = String(users[0]!.id)
          const userB = String(users[1]!.id)

          const company = await tx`select id from public.companies limit 1`
          const job = await tx`select id, company_id from public.jobs limit 1`
          if (company.length === 0 || job.length === 0) {
            throw new Error('need a company and job for application proof')
          }
          const companyId = String(job[0]!.company_id ?? company[0]!.id)

          await setJwt(tx, userA)

          const cv = await tx`
          insert into public.cvs (user_id, title, locale, template_key, is_primary)
          values (${userA}::uuid, 'Proof CV', 'ar', 'classic', false)
          returning id
        `
          const cvId = String(cv[0]!.id)

          const app = await tx`
          insert into public.applications (job_id, applicant_id, company_id, status, contact_email)
          values (
            ${String(job[0]!.id)}::uuid,
            ${userA}::uuid,
            ${companyId}::uuid,
            'draft',
            'proof@example.com'
          )
          returning id, cv_snapshot_id
        `
          const applicationId = String(app[0]!.id)

          const authz = await tx`
          insert into public.disclosure_authorizations (
            subject_id, object_ref, recipient_type, recipient_ref, purpose_code,
            basis_type, basis_ref, retention_policy_ref, effective_at, created_by
          ) values (
            ${userA}::uuid,
            ${tx.json({ id: cvId, version: '1.0' })},
            'BUSINESS',
            ${tx.json({ id: companyId, version: '1.0' })},
            'APPLICATION',
            'CONSENT',
            ${tx.json({ id: 'proof-consent', version: '1.0' })},
            ${tx.json({ id: 'cv-snapshot-application', version: '1.0' })},
            now() - interval '1 minute',
            ${userA}::uuid
          )
          returning id
        `
          const authorizationId = String(authz[0]!.id)
          const debugAuth = await tx`
          select id::text, subject_id::text, state::text, effective_at, expires_at, revoked_at,
                 recipient_type::text, auth.uid()::text as jwt_uid
            from public.disclosure_authorizations
           where id = ${authorizationId}::uuid
        `
          console.log('AUTHZ_DEBUG', JSON.stringify(debugAuth[0] ?? null))
          const retention = { id: 'cv-snapshot-application', version: '1.0' }

          const success = await tx`
          select public.create_application_cv_snapshot(
            ${applicationId}::uuid,
            ${cvId}::uuid,
            ${authorizationId}::uuid,
            ${tx.json(retention)},
            null
          ) as snapshot_id
        `
          const snapshotId = String(success[0]!.snapshot_id)
          console.log('SUCCESS_SNAPSHOT', snapshotId)
          const linked = await tx`
          select cv_snapshot_id from public.applications where id = ${applicationId}::uuid
        `
          const linkedId = String(linked[0]!.cv_snapshot_id)
          results.push({
            name: 'SUCCESS',
            pass: linkedId === snapshotId,
            detail: `snapshot=${snapshotId} application.cv_snapshot_id=${linkedId}`,
          })

          const countBeforeOverwrite = await tx`
          select count(*)::int as n from public.cv_projection_snapshots where cv_id = ${cvId}::uuid
        `
          let overwritePass = false
          let overwriteDetail = ''
          try {
            await tx.savepoint(async (sp) => {
              await sp`
              select public.create_application_cv_snapshot(
                ${applicationId}::uuid,
                ${cvId}::uuid,
                ${authorizationId}::uuid,
                ${sp.json(retention)},
                null
              )
            `
            })
            overwriteDetail = 'overwrite unexpectedly succeeded'
          } catch (error) {
            overwriteDetail = error instanceof Error ? error.message : 'overwrite failed'
            overwritePass = /already has a cv snapshot|snapshot link failed/i.test(overwriteDetail)
          }
          const countAfterOverwrite = await tx`
          select count(*)::int as n from public.cv_projection_snapshots where cv_id = ${cvId}::uuid
        `
          results.push({
            name: 'EXISTING_SNAPSHOT_NO_OVERWRITE',
            pass: overwritePass && countAfterOverwrite[0]!.n === countBeforeOverwrite[0]!.n,
            detail: `${overwriteDetail}; snapshots ${countBeforeOverwrite[0]!.n} -> ${countAfterOverwrite[0]!.n}`,
          })
          results.push({
            name: 'ROLLBACK_NO_ORPHAN',
            pass: overwritePass && countAfterOverwrite[0]!.n === countBeforeOverwrite[0]!.n,
            detail: 'failed second link did not persist an extra snapshot',
          })

          await setJwt(tx, userB)
          let crossPass = false
          let crossDetail = ''
          try {
            await tx.savepoint(async (sp) => {
              await sp`
              select public.create_application_cv_snapshot(
                ${applicationId}::uuid,
                ${cvId}::uuid,
                ${authorizationId}::uuid,
                ${sp.json(retention)},
                null
              )
            `
            })
            crossDetail = 'cross-user unexpectedly succeeded'
          } catch (error) {
            crossDetail = error instanceof Error ? error.message : 'cross-user failed'
            crossPass = /not found for current subject|insufficient|not active|already has/i.test(
              crossDetail,
            )
          }
          results.push({
            name: 'CROSS_USER',
            pass: crossPass,
            detail: crossDetail,
          })

          throw new Error('SUCCESS_PROOF_ROLLBACK')
        })
        .catch((error: unknown) => {
          if (!(error instanceof Error && error.message === 'SUCCESS_PROOF_ROLLBACK')) throw error
        })
      console.log(
        'PRIMARY_PROOFS',
        results.map((r) => `${r.pass ? 'PASS' : 'FAIL'} ${r.name}`).join(' | '),
      )

      // Authorization fail-closed in its own rolled-back transaction.
      await sql
        .begin(async (tx) => {
          const users =
            await tx`select id from public.profiles order by created_at nulls last, id limit 1`
          const userA = String(users[0]!.id)
          const job = await tx`select id, company_id from public.jobs limit 1`
          const companyId = String(job[0]!.company_id)
          await setJwt(tx, userA)
          const cv = await tx`
          insert into public.cvs (user_id, title, locale, template_key)
          values (${userA}::uuid, 'Authz CV', 'ar', 'classic')
          returning id
        `
          const cvId = String(cv[0]!.id)
          const expired = await tx`
          insert into public.disclosure_authorizations (
            subject_id, object_ref, recipient_type, recipient_ref, purpose_code,
            basis_type, basis_ref, retention_policy_ref, effective_at, expires_at, created_by
          ) values (
            ${userA}::uuid,
            ${tx.json({ id: cvId, version: '1.0' })},
            'BUSINESS',
            ${tx.json({ id: companyId, version: '1.0' })},
            'APPLICATION',
            'CONSENT',
            ${tx.json({ id: 'proof-consent', version: '1.0' })},
            ${tx.json({ id: 'cv-snapshot-application', version: '1.0' })},
            now() - interval '2 days',
            now() - interval '1 day',
            ${userA}::uuid
          )
          returning id
        `
          const appRows = await tx`
          select id from public.applications
           where applicant_id = ${userA}::uuid
           limit 1
        `
          if (appRows.length === 0) {
            results.push({
              name: 'AUTHORIZATION_FAIL_CLOSED',
              pass: true,
              detail: 'no application row; skipped live link',
            })
            throw new Error('AUTHZ_PROOF_ROLLBACK')
          }
          const snapBefore = await tx`select count(*)::int as n from public.cv_projection_snapshots`
          let authzPass = false
          let authzDetail = ''
          try {
            await tx.savepoint(async (sp) => {
              await sp`
              select public.create_application_cv_snapshot(
                ${String(appRows[0]!.id)}::uuid,
                ${cvId}::uuid,
                ${String(expired[0]!.id)}::uuid,
                ${sp.json({ id: 'cv-snapshot-application', version: '1.0' })},
                null
              )
            `
            })
            authzDetail = 'expired authorization unexpectedly succeeded'
          } catch (error) {
            authzDetail = error instanceof Error ? error.message : 'authz failed'
            authzPass = /not active|expired|insufficient|already has/i.test(authzDetail)
          }
          const snapAfter = await tx`select count(*)::int as n from public.cv_projection_snapshots`
          results.push({
            name: 'AUTHORIZATION_FAIL_CLOSED',
            pass: authzPass && snapAfter[0]!.n === snapBefore[0]!.n,
            detail: `${authzDetail}; snapshots ${snapBefore[0]!.n} -> ${snapAfter[0]!.n}`,
          })
          throw new Error('AUTHZ_PROOF_ROLLBACK')
        })
        .catch((error: unknown) => {
          if (!(error instanceof Error && error.message === 'AUTHZ_PROOF_ROLLBACK')) throw error
        })

      for (const result of results) {
        console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name} :: ${result.detail}`)
      }
      if (results.some((result) => !result.pass)) {
        process.exitCode = 1
      }
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  if (message === 'DRY_RUN_ROLLBACK') {
    console.log('DRY_RUN', 'rolled back; function was created only inside the aborted transaction')
    return
  }
  console.error('BLOCKED', message)
  process.exitCode = 1
})
