import {
  captureSnapshot,
  createNonprodSql,
  loadNonprodEnv,
  writeSnapshotReport,
} from './nonprod-catalog-snapshot'

async function main() {
  const env = loadNonprodEnv()
  const sql = createNonprodSql(env)
  try {
    const snapshot = await captureSnapshot(sql)
    await writeSnapshotReport(
      'JID_NONPROD_CATALOG_PREIMPORT_SNAPSHOT.md',
      'JID Nonprod Catalog Pre-Import Snapshot',
      snapshot,
    )
    console.log(JSON.stringify(snapshot, null, 2))
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
