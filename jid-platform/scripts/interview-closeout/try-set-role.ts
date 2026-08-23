import { createNonprodSql, loadNonprodEnv } from '../catalog/nonprod-catalog-snapshot'

async function main() {
  const sql = createNonprodSql(loadNonprodEnv())
  const roles = await sql`
    SELECT rolname, rolcanlogin, rolbypassrls
    FROM pg_roles
    WHERE rolname IN ('lammah_function_owner', 'lammah_worker', 'postgres')
    ORDER BY 1
  `
  const members = await sql`
    SELECT r.rolname AS role, m.rolname AS member
    FROM pg_auth_members am
    JOIN pg_roles r ON r.oid = am.roleid
    JOIN pg_roles m ON m.oid = am.member
    WHERE r.rolname IN ('lammah_function_owner', 'lammah_worker')
       OR m.rolname IN ('lammah_function_owner', 'lammah_worker', 'postgres')
    ORDER BY 1, 2
  `
  console.log(JSON.stringify({ roles, members }, null, 2))

  for (const role of ['lammah_function_owner', 'lammah_worker'] as const) {
    try {
      await sql.unsafe(`GRANT ${role} TO postgres WITH SET TRUE`)
      await sql.unsafe(`SET ROLE ${role}`)
      const after = await sql`SELECT current_user`
      await sql`RESET ROLE`
      console.log('set_role_ok', role, after)
    } catch (error) {
      console.log('set_role_failed', role, error instanceof Error ? error.message : error)
      await sql`RESET ROLE`.catch(() => undefined)
    }
  }
  await sql.end({ timeout: 1 }).catch(() => undefined)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
