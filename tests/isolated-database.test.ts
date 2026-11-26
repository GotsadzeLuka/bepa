import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requireIsolatedDatabase } from '../scripts/isolated-database'

const database = 'postgresql://test@127.0.0.1:5432/bepa'
const env: NodeJS.ProcessEnv = { BEPA_ISOLATED_TEST: '1', NODE_ENV: 'test', DATABASE_URL: database }

test('the test database guard checks both connection URLs', () => {
  assert.throws(() => requireIsolatedDatabase({
    ...env, DATABASE_URL: 'postgresql://example.invalid/bepa', DIRECT_URL: database,
  }), /disposable loopback PostgreSQL/)
  assert.throws(() => requireIsolatedDatabase({
    ...env, DIRECT_URL: 'postgresql://example.invalid/bepa',
  }), /disposable loopback PostgreSQL/)
})

test('the test database guard requires opt-in and handles an empty direct URL', () => {
  assert.throws(() => requireIsolatedDatabase({ ...env, BEPA_ISOLATED_TEST: undefined }))
  assert.equal(requireIsolatedDatabase({ ...env, DIRECT_URL: '' }), database)
})
