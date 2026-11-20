import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
const grants = sql.slice(sql.indexOf('-- DATA API GRANTS: read-only browser access'))

test('schema revokes historical browser mutations and grants only read access', () => {
  assert.match(grants, /REVOKE ALL ON TABLE[\s\S]+?profiles,[\s\S]+?orders, order_items,[\s\S]+?wishlist, reviews,[\s\S]+?FROM PUBLIC, anon, authenticated;/)
  assert.match(grants, /GRANT SELECT ON profiles, orders, order_items, wishlist\s+TO authenticated;/)
  assert.doesNotMatch(grants, /GRANT\s+(?:INSERT|UPDATE|DELETE|ALL)\s+ON\s+/i)
})

test('browser policies do not authorize direct checkout or review moderation', () => {
  assert.doesNotMatch(sql, /CREATE POLICY "Users and guests can create scoped orders" ON orders/)
  assert.doesNotMatch(sql, /CREATE POLICY "Users and guests can create scoped order items" ON order_items/)
  assert.doesNotMatch(sql, /CREATE POLICY "Users can update own profile" ON profiles/)
  assert.doesNotMatch(sql, /CREATE POLICY "Users can insert own profile" ON profiles/)
  assert.doesNotMatch(sql, /CREATE POLICY "Users can update own reviews" ON reviews/)
  assert.doesNotMatch(sql, /CREATE POLICY "Users can create reviews" ON reviews/)
})
