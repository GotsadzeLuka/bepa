/**
 * Optional read-only verification against a configured Supabase Postgres database.
 * Requires DIRECT_URL or DATABASE_URL with access to information_schema and
 * pg_catalog. Never modifies production data. Not run by offline CI.
 */
import { Client } from 'pg'

const applicationTables = [
  'profiles', 'categories', 'products', 'product_images', 'product_variants',
  'orders', 'order_items', 'wishlist', 'reviews', 'news',
] as const

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  if (!connectionString) throw new Error('Set DIRECT_URL or DATABASE_URL')
  const client = new Client({ connectionString, connectionTimeoutMillis: 10000 })
  await client.connect()
  try {
    let failed = false
    for (const role of ['anon', 'authenticated'] as const) {
      for (const table of applicationTables) {
        const sql = 'SELECT has_table_privilege($1, $2, $3) AS granted'
        for (const privilege of ['INSERT', 'UPDATE', 'DELETE'] as const) {
          const { rows } = await client.query<{ granted: boolean }>(sql, [role, 'public.' + table, privilege])
          if (rows[0]?.granted) {
            console.error('FAIL: ' + role + ' retains ' + privilege + ' on ' + table)
            failed = true
          }
        }
      }
    }
    if (failed) throw new Error('Browser-facing database roles have excessive privileges')
    console.log('PASS: browser roles have no table-level write privileges')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
