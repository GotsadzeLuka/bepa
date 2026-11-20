import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Client } from 'pg'

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!url || process.env.NODE_ENV !== 'test' ||
    !['127.0.0.1', 'localhost'].includes(new URL(url).hostname)) {
  throw new Error('RLS bootstrap requires NODE_ENV=test and disposable loopback PostgreSQL')
}

const bootstrap = `
  CREATE SCHEMA IF NOT EXISTS auth;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  END $$;
  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY,
    email text NOT NULL UNIQUE
  );
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA auth TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
`

async function main() {
  const client = new Client({connectionString:url, connectionTimeoutMillis:10000})
  await client.connect()
  try {
    await client.query(bootstrap)
    const schemaSql = await readFile(resolve('supabase/schema.sql'),'utf8')
    await client.query(schemaSql)
    console.log('Disposable Supabase-compatible RLS schema, grants, and policies applied')
  } finally { await client.end() }
}
main().catch(error=>{
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode=1
})
