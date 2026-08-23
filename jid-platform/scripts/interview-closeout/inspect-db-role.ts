import { createNonprodSql, loadNonprodEnv } from '../catalog/nonprod-catalog-snapshot'

async function main() {
  const sql = createNonprodSql(loadNonprodEnv())
  const identity = await sql`
    SELECT current_user, session_user, current_setting('role', true) AS role
  `
  const owners = await sql`
    SELECT p.proname, r.rolname AS owner
    FROM pg_proc p
    JOIN pg_roles r ON r.oid = p.proowner
    WHERE p.proname IN (
      'review_directory_candidate',
      'publish_directory_candidate',
      'catalog_claim_review_item',
      'ingest_lammah_candidate',
      'lammah_begin_source_run',
      'lammah_staff_actor',
      'staff_claim_lammah_candidate'
    )
    ORDER BY p.proname
  `
  const roles = await sql`
    SELECT rolname FROM pg_roles
    WHERE rolname IN ('postgres', 'catalog_function_owner', 'supabase_admin', 'authenticator')
    ORDER BY 1
  `
  console.log(JSON.stringify({ identity, owners, roles }, null, 2))
  await sql.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
