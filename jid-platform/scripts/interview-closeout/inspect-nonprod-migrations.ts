import { createNonprodSql, loadNonprodEnv } from '../catalog/nonprod-catalog-snapshot'

async function main() {
  const sql = createNonprodSql(loadNonprodEnv())
  const cols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
    ORDER BY ordinal_position
  `
  const recent = await sql`
    SELECT * FROM supabase_migrations.schema_migrations
    ORDER BY version DESC
    LIMIT 8
  `
  console.log(JSON.stringify({ cols, recent }, null, 2))
  await sql.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
