import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Client } from 'pg'

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!url) throw new Error('DIRECT_URL or DATABASE_URL is required')

const client = new Client({ connectionString: url, connectionTimeoutMillis: 10_000 })
async function main() {
  await client.connect()
  try {
    const sql = await readFile(resolve('supabase/integrity.sql'), 'utf8')
    await client.query(sql)
    console.log('Database integrity checks applied')
  } finally {
    await client.end()
  }
}
main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
