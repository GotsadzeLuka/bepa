import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getSafeRedirect } from '../src/lib/safe-redirect'

test('valid same-origin destinations are preserved', () => {
  assert.equal(getSafeRedirect('/'), '/')
  assert.equal(getSafeRedirect('/account/orders?sort=desc'), '/account/orders?sort=desc')
  assert.equal(getSafeRedirect('/checkout#delivery'), '/checkout#delivery')
})

test('unsafe and ambiguous redirects fall back to root', () => {
  for (const input of [
    null, undefined, '', 'https://evil.example', '//evil.example',
    '/\\evil.example', '/%5cevil.example', '/%2fevil.example',
    '/%255cevil.example', '/%252fevil.example',
    '/%0a/evil.example', '/%0d', '/%00', '/%GG',
    '/account\\evil.example', '\n/checkout',
    'javascript:alert(1)', 'https:%2f%2fevil.example',
    '/' + 'a'.repeat(1025),
  ]) {
    assert.equal(getSafeRedirect(input), '/', 'unexpected redirect for ' + String(input))
  }
})
