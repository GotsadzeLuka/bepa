import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import { Client } from 'pg'

config({ path: '.env' })
config({ path: '.env.local', override: true })

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('Missing DIRECT_URL or DATABASE_URL')
}

async function main() {
  const schemaPath = resolve('supabase/schema.sql')
  const schemaSql = await readFile(schemaPath, 'utf8')
  const integritySql = await readFile(resolve('supabase/integrity.sql'), 'utf8')
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10_000,
  })

  await client.connect()
  try {
    await client.query(schemaSql)
    await client.query(integritySql)
    console.log(`Applied Supabase schema bootstrap from ${schemaPath}`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
